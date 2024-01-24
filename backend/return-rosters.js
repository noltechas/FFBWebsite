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

// Function to fetch rosters from Sleeper API
async function fetchRosters(leagueId) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/rosters`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching rosters:', error);
        return [];
    }
}

// Function to get player name by ID from the database
function getPlayerName(playerId) {
    return new Promise((resolve, reject) => {
        const playerConnection = new Connection(config);
        playerConnection.on('connect', err => {
            if (err) {
                console.error('Error connecting to the database:', err);
                reject(err);
            } else {
                const sqlQuery = "SELECT first_name, last_name FROM Players WHERE player_id = @player_id";
                const request = new Request(sqlQuery, (err) => {
                    playerConnection.close(); // Close the connection when done
                    if (err) {
                        reject(err);
                    }
                });

                request.addParameter('player_id', TYPES.NVarChar, playerId);

                let playerName = '';
                request.on('row', (columns) => {
                    columns.forEach(column => {
                        playerName += column.value + ' ';
                    });
                    resolve(playerName.trim());
                });

                playerConnection.execSql(request);
            }
        });

        playerConnection.connect();
    });
}

// Main function to process rosters and get player names
async function processRosters(leagueId) {
    const rosters = await fetchRosters(leagueId);

    for (const roster of rosters) {
        console.log(`Roster ID: ${roster.roster_id}`);
        for (const playerId of roster.players) {
            // Wait for each getPlayerName to complete before proceeding to the next
            try {
                const playerName = await getPlayerName(playerId);
                console.log(`Player ID: ${playerId}, Name: ${playerName}`);
            } catch (err) {
                console.error(`Error getting player name for player ID ${playerId}:`, err);
            }
        }
    }
}

// Connect to the database and process rosters
connection.on('connect', err => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database.');
        const leagueId = '985569785293467648'; // Replace with your league ID
        processRosters(leagueId).then(() => {
            console.log('Finished processing rosters.');
            connection.close(); // Close the connection when done
        });
    }
});

connection.connect();
