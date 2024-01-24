const { Connection, Request, TYPES } = require('tedious');
const axios = require('axios');

// Create connection to your database using config
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

const { promisify } = require('util');
function insertPlayerData(playerData, connection) {
    const sqlUpsert = `
        MERGE INTO dbo.Players AS target
        USING (SELECT @player_id AS player_id) AS source
        ON target.player_id = source.player_id
        WHEN MATCHED THEN
            UPDATE SET
                hashtag = @hashtag,
                depth_chart_position = @depth_chart_position,
                status = @status,
                sport = @sport,
                fantasy_positions = @fantasy_positions,
                number = @number,
                search_last_name = @search_last_name,
                injury_start_date = @injury_start_date,
                weight = @weight,
                position = @position,
                practice_participation = @practice_participation,
                sportradar_id = @sportradar_id,
                team = @team,
                last_name = @last_name,
                college = @college,
                fantasy_data_id = @fantasy_data_id,
                injury_status = @injury_status,
                height = @height,
                search_full_name = @search_full_name,
                age = @age,
                stats_id = @stats_id,
                birth_country = @birth_country,
                espn_id = @espn_id,
                search_rank = @search_rank,
                first_name = @first_name,
                depth_chart_order = @depth_chart_order,
                years_exp = @years_exp,
                rotowire_id = @rotowire_id,
                rotoworld_id = @rotoworld_id,
                search_first_name = @search_first_name,
                yahoo_id = @yahoo_id
        WHEN NOT MATCHED THEN
            INSERT (player_id, hashtag, depth_chart_position, status, sport, fantasy_positions, number, search_last_name, injury_start_date, weight, position, practice_participation, sportradar_id, team, last_name, college, fantasy_data_id, injury_status, height, search_full_name, age, stats_id, birth_country, espn_id, search_rank, first_name, depth_chart_order, years_exp, rotowire_id, rotoworld_id, search_first_name, yahoo_id)
            VALUES (@player_id, @hashtag, @depth_chart_position, @status, @sport, @fantasy_positions, @number, @search_last_name, @injury_start_date, @weight, @position, @practice_participation, @sportradar_id, @team, @last_name, @college, @fantasy_data_id, @injury_status, @height, @search_full_name, @age, @stats_id, @birth_country, @espn_id, @search_rank, @first_name, @depth_chart_order, @years_exp, @rotowire_id, @rotoworld_id, @search_first_name, @yahoo_id);
    `;

    return new Promise((resolve, reject) => {
        const request = new Request(sqlUpsert, (err) => {
            if (err) {
                console.error('Error executing SQL for player_id:', playerData.player_id, err);
                reject(err);
            } else {
                console.log(`Processed player data for player_id: ${playerData.player_id}`);
                resolve();
            }
        });

        // Convert number to string and handle null or undefined values
        const convertToString = (value) => {
            if (value === null || value === undefined) {
                return null;
            }
            return value.toString();
        };

        // Convert number to integer and handle null or non-numeric values
        const convertToInt = (value) => {
            if (value === null || value === undefined || isNaN(value)) {
                return null;
            }
            return parseInt(value);
        };

        // Add parameters for your SQL INSERT statement
        // Check if fantasy_positions is an array and join, else set to null
        const fantasyPositions = Array.isArray(playerData.fantasy_positions) ? playerData.fantasy_positions.join(',') : null;
        request.addParameter('fantasy_positions', TYPES.NVarChar, fantasyPositions);

        request.addParameter('player_id', TYPES.NVarChar, playerData.player_id);
        request.addParameter('hashtag', TYPES.NVarChar, playerData.hashtag);
        request.addParameter('depth_chart_position', TYPES.Int, convertToInt(playerData.depth_chart_position));
        request.addParameter('status', TYPES.NVarChar, playerData.status);
        request.addParameter('sport', TYPES.NVarChar, playerData.sport);
        request.addParameter('number', TYPES.Int, playerData.number);
        request.addParameter('search_last_name', TYPES.NVarChar, playerData.search_last_name);
        request.addParameter('injury_start_date', TYPES.Date, playerData.injury_start_date);
        request.addParameter('weight', TYPES.NVarChar, playerData.weight);
        request.addParameter('position', TYPES.NVarChar, playerData.position);
        request.addParameter('practice_participation', TYPES.NVarChar, playerData.practice_participation);
        request.addParameter('sportradar_id', TYPES.NVarChar, playerData.sportradar_id);
        request.addParameter('team', TYPES.NVarChar, playerData.team);
        request.addParameter('last_name', TYPES.NVarChar, playerData.last_name);
        request.addParameter('college', TYPES.NVarChar, playerData.college);
        request.addParameter('fantasy_data_id', TYPES.Int, playerData.fantasy_data_id);
        request.addParameter('injury_status', TYPES.NVarChar, playerData.injury_status);
        request.addParameter('height', TYPES.NVarChar, playerData.height);
        request.addParameter('search_full_name', TYPES.NVarChar, playerData.search_full_name);
        request.addParameter('age', TYPES.Int, playerData.age);
        request.addParameter('stats_id', TYPES.NVarChar, convertToString(playerData.stats_id));
        request.addParameter('birth_country', TYPES.NVarChar, playerData.birth_country);
        request.addParameter('espn_id', TYPES.NVarChar, convertToString(playerData.espn_id));
        request.addParameter('search_rank', TYPES.Int, playerData.search_rank);
        request.addParameter('first_name', TYPES.NVarChar, playerData.first_name);
        request.addParameter('depth_chart_order', TYPES.Int, playerData.depth_chart_order);
        request.addParameter('years_exp', TYPES.Int, playerData.years_exp);
        request.addParameter('rotowire_id', TYPES.NVarChar, convertToString(playerData.rotowire_id));
        request.addParameter('rotoworld_id', TYPES.Int, playerData.rotoworld_id);
        request.addParameter('search_first_name', TYPES.NVarChar, playerData.search_first_name);
        request.addParameter('yahoo_id', TYPES.NVarChar, convertToString(playerData.yahoo_id));

        // Execute the SQL request
        connection.execSql(request);
    });
}

async function fetchMatchupDataForRoster(rosterId, leagueId, week) {
    const sql = `
        SELECT m.players_points, m.starters_points
        FROM Matchups m
        WHERE m.roster_id = @rosterId AND m.league_id = @leagueId AND m.week = @week;
    `;

    return new Promise((resolve, reject) => {
        const request = new Request(sql, (err, rowCount) => {
            if (err) {
                console.error('Error executing SQL:', err);
                reject(err);
            }
            if (rowCount === 0) {
                resolve(null);
            }
        });

        let matchupData = null;
        request.addParameter('rosterId', TYPES.Int, rosterId);
        request.addParameter('leagueId', TYPES.NVarChar, leagueId);
        request.addParameter('week', TYPES.Int, week);

        request.on('row', columns => {
            const playersPoints = JSON.parse(columns[0].value);
            const starters = JSON.parse(columns[1].value);
            matchupData = { playersPoints, starters };
        });

        request.on('requestCompleted', () => {
            resolve(matchupData);
        });

        connection.execSql(request);
    });
}

async function fetchPlayerData(playerId) {
    const sql = `SELECT * FROM Players WHERE player_id = @playerId;`;

    return new Promise((resolve, reject) => {
        const request = new Request(sql, (err, rowCount) => {
            if (err) {
                console.error('Error executing SQL:', err);
                reject(err);
            }
            if (rowCount === 0) {
                console.log(`No data found for player ID: ${playerId}`);
                resolve(null);
            }
        });

        let playerData = {};
        request.addParameter('playerId', TYPES.NVarChar, playerId);

        request.on('row', columns => {
            columns.forEach(column => {
                playerData[column.metadata.colName] = column.value;
            });
        });

        request.on('requestCompleted', () => {
            if (Object.keys(playerData).length === 0) {
                console.log(`No data found for player ID: ${playerId}`);
                resolve(null);
            } else {
                resolve(playerData);
            }
        });

        connection.execSql(request);
    });
}

async function fetchRosterIdForUser(displayName) {
    const sql = `
        SELECT r.roster_id, r.league_id
        FROM Users u
        INNER JOIN Rosters r ON u.user_id = r.user_id
        WHERE u.display_name = @displayName;
    `;

    return new Promise((resolve, reject) => {
        const request = new Request(sql, (err, rowCount) => {
            if (err) {
                console.error('Error executing SQL:', err);
                reject(err);
            }
            if (rowCount === 0) {
                resolve(null);
            }
        });

        let rosterInfo = null;
        request.addParameter('displayName', TYPES.NVarChar, displayName);

        request.on('row', columns => {
            rosterInfo = {
                rosterId: columns[0].value,
                leagueId: columns[1].value
            };
        });

        request.on('requestCompleted', () => {
            resolve(rosterInfo);
        });

        connection.execSql(request);
    });
}

// List of Big Ten Conference schools
const bigTenSchools = [
    "Indiana", "Maryland", "Michigan", "Michigan State",
    "Ohio State", "Penn State", "Rutgers",
    "Illinois", "Iowa", "Minnesota", "Nebraska",
    "Northwestern", "Purdue", "Wisconsin"
];

async function calculateScoreForUser(displayName, week) {
    let totalScore = 0;

    // Fetching the roster_id and league_id of the user
    const rosterInfo = await fetchRosterIdForUser(displayName);
    if (!rosterInfo) {
        console.error('Roster not found for user:', displayName);
        return 0;
    }

    // Fetching matchup data for the user's roster for the specified week
    const matchups = await fetchMatchupDataForRoster(rosterInfo.rosterId, rosterInfo.leagueId, week);
    if (!matchups) {
        console.error('Matchup data not found for:', displayName, 'Week:', week);
        return 0;
    }

    const { playersPoints, starters } = matchups;

    // Create a map of points to player IDs (for reverse lookup)
    let pointsToPlayerId = {};
    for (const playerId in playersPoints) {
        const points = playersPoints[playerId];
        if (!pointsToPlayerId[points]) {
            pointsToPlayerId[points] = [];
        }
        pointsToPlayerId[points].push(playerId);
    }

    // Iterate over each starter's points and match with player ID
    for (const points of starters) {
        const playerIds = pointsToPlayerId[points];
        if (playerIds) {
            for (const playerId of playerIds) {
                // Fetch player data from database
                const playerData = await fetchPlayerData(playerId);
                console.log(playerData.last_name + ": " + playerData.college)
                if (playerData && bigTenSchools.includes(playerData.college)) {
                    // Add the player's score to the total if they went to a Big Ten school
                    totalScore += points;
                }
            }
        }
    }

    return totalScore;
}

// Rest of your code remains the same


// Function to fetch data from Sleeper API and insert into the database
async function updatePlayers(connection) {
    const url = 'https://api.sleeper.app/v1/players/nfl';

    try {
        const response = await axios.get(url);
        const players = response.data;

        for (const playerId of Object.keys(players)) {
            await insertPlayerData(players[playerId], connection);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Attempt to connect and execute queries if connection goes through
connection.on('connect', err => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the database.');
        //updatePlayers(connection);
        calculateScoreForUser('DaRockyRock', 1)
            .then(score => console.log('Total Score:', score))
            .catch(err => console.error('Error:', err));
    }
});

connection.connect();
