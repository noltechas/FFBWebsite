const axios = require('axios');
const { Connection, Request, TYPES } = require('tedious');

// Database connection configuration
const config = {
    authentication: {
        type: 'default',
        options: {
            userName: 'darockyrock', // update me
            password: 'kaxfam-nuxqAt-juzpo9', // update me
        },
    },
    server: 'odyssey-fantasy-server.database.windows.net', // update me
    options: {
        database: 'Users', // Replace 'Users' with your actual database name
        encrypt: true,
    },
};

const connection = new Connection(config);

async function fetchMatchupData(leagueId, week) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching matchups for week ${week}:`, error);
        return [];
    }
}

async function fetchLeagueData(leagueId) {
    const usersUrl = `https://api.sleeper.app/v1/league/${leagueId}/users`;
    const rostersUrl = `https://api.sleeper.app/v1/league/${leagueId}/rosters`;

    try {
        const [usersResponse, rostersResponse] = await Promise.all([
            axios.get(usersUrl),
            axios.get(rostersUrl)
        ]);

        const users = usersResponse.data;
        const rosters = rostersResponse.data;

        for (const user of users) {
            const roster = rosters.find(r => r.owner_id === user.user_id);
            await insertUserData(user, roster, leagueId);
        }
    } catch (error) {
        console.error('Error fetching league data:', error);
    }
}

async function insertMatchupData(matchups, leagueId, week) {
    const sqlMatchup = `
        MERGE INTO Matchups AS Target
        USING (SELECT @league_id AS league_id, @week AS week, @roster_id AS roster_id) AS Source
        ON Target.league_id = Source.league_id AND Target.week = Source.week AND Target.roster_id = Source.roster_id
        WHEN MATCHED THEN
            UPDATE SET
                matchup_id = @matchup_id,
                points = @points,
                players_points = @players_points,
                starters_points = @starters_points
        WHEN NOT MATCHED THEN
            INSERT (league_id, week, roster_id, matchup_id, points, players_points, starters_points)
            VALUES (@league_id, @week, @roster_id, @matchup_id, @points, @players_points, @starters_points);
    `;

    for (const matchup of matchups) {
        // Ensure 'matchup_id' is not null and is extracted correctly
        if (matchup.matchup_id == null) {
            console.error('matchup_id is null for matchup:', matchup);
            continue; // Skip this iteration as matchup_id is crucial and cannot be null
        }

        const points = matchup.points;
        const playersPoints = JSON.stringify(matchup.players_points);
        const startersPoints = JSON.stringify(matchup.starters_points);

        await executeSql(sqlMatchup, [
            { name: 'league_id', type: TYPES.NVarChar, value: leagueId },
            { name: 'week', type: TYPES.Int, value: week },
            { name: 'roster_id', type: TYPES.Int, value: matchup.roster_id },
            { name: 'matchup_id', type: TYPES.Int, value: matchup.matchup_id }, // Make sure this value is not null
            { name: 'points', type: TYPES.Float, value: points },
            { name: 'players_points', type: TYPES.NVarChar, value: playersPoints },
            { name: 'starters_points', type: TYPES.NVarChar, value: startersPoints }
        ]);
    }
}

async function insertUserData(user, roster, leagueId) {
    if (!roster) {
        console.warn(`No roster found for user: ${user.user_id}`);
        return;
    }

    const sqlUser = `
        MERGE INTO Users AS Target
        USING (SELECT @user_id AS user_id) AS Source
        ON Target.user_id = Source.user_id
        WHEN MATCHED THEN
            UPDATE SET
                username = @username,
                display_name = @display_name,
                avatar = @avatar,
                team_name = @team_name
        WHEN NOT MATCHED THEN
            INSERT (user_id, username, display_name, avatar, team_name)
            VALUES (@user_id, @username, @display_name, @avatar, @team_name);
    `;

    const sqlRoster = `
        MERGE INTO Rosters AS Target
        USING (SELECT @user_id AS user_id, @roster_id AS roster_id) AS Source
        ON Target.user_id = Source.user_id AND Target.roster_id = Source.roster_id
        WHEN MATCHED THEN
            UPDATE SET
                league_id = @league_id,
                wins = @wins,
                losses = @losses,
                ties = @ties,
                total_points = @total_points,
                waiver_position = @waiver_position
        WHEN NOT MATCHED THEN
            INSERT (user_id, roster_id, league_id, wins, losses, ties, total_points, waiver_position)
            VALUES (@user_id, @roster_id, @league_id, @wins, @losses, @ties, @total_points, @waiver_position);
    `;

    await executeSql(sqlUser, [
        { name: 'user_id', type: TYPES.NVarChar, value: user.user_id },
        { name: 'username', type: TYPES.NVarChar, value: user.username },
        { name: 'display_name', type: TYPES.NVarChar, value: user.display_name },
        { name: 'avatar', type: TYPES.NVarChar, value: user.avatar },
        { name: 'team_name', type: TYPES.NVarChar, value: user.metadata && user.metadata.team_name ? user.metadata.team_name : null }
    ]);

    await executeSql(sqlRoster, [
        { name: 'roster_id', type: TYPES.Int, value: roster.roster_id },
        { name: 'user_id', type: TYPES.NVarChar, value: roster.owner_id },
        { name: 'league_id', type: TYPES.NVarChar, value: leagueId },
        { name: 'wins', type: TYPES.Int, value: roster.settings.wins },
        { name: 'losses', type: TYPES.Int, value: roster.settings.losses },
        { name: 'ties', type: TYPES.Int, value: roster.settings.ties },
        { name: 'total_points', type: TYPES.Float, value: roster.settings.fpts },
        { name: 'waiver_position', type: TYPES.Int, value: roster.settings.waiver_position }
    ]);
}

async function executeSql(sql, parameters) {
    return new Promise((resolve, reject) => {
        const request = new Request(sql, (err) => {
            if (err) {
                console.error('Error executing SQL:', err);
                reject(err);
            } else {
                resolve();
            }
        });

        parameters.forEach(param => {
            request.addParameter(param.name, param.type, param.value);
        });

        connection.execSql(request);
    });
}

async function main() {
    const leagueIds = ['985569785293467648', '985978467361583104', '985571036416544768', '985978629114970112',
        '985570334562721792', '985570243441487872', '985570133928132608', '985273817578659840'];
    const totalWeeks = 17;

    connection.on('connect', async (err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
        } else {
            console.log('Connected to the database.');

            for (const leagueId of leagueIds) {
                await fetchLeagueData(leagueId);

                for (let week = 1; week <= totalWeeks; week++) {
                    const matchups = await fetchMatchupData(leagueId, week);
                    await insertMatchupData(matchups, leagueId, week);
                }
            }

            connection.close();
        }
    });

    connection.connect();
}

main();
