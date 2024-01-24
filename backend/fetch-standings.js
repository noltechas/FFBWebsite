const express = require('express');
const { Connection, Request, TYPES } = require('tedious');
const axios = require('axios');

// Set up Express
const app = express();

// Database connection configuration
const config = {
    authentication: {
        type: 'default',
        options: {
            userName: 'darockyrock', // Update with your credentials
            password: 'kaxfam-nuxqAt-juzpo9',
        },
    },
    server: 'odyssey-fantasy-server.database.windows.net', // Update with your server name
    options: {
        database: 'Users', // Update with your database name
        encrypt: true,
    },
};

const connection = new Connection(config);

// Function to calculate standings
async function calculateStandings() {
    return new Promise((resolve, reject) => {
        // Implement logic to fetch and calculate standings
        // Example: SELECT SUM(wins) as total_wins, SUM(losses) as total_losses, ... FROM Rosters GROUP BY user_id
        const sql = `SELECT 
                        u.display_name,
                        r.user_id,
                        SUM(r.wins) AS total_wins,
                        SUM(r.losses) AS total_losses,
                        SUM(r.ties) AS total_ties,
                        SUM(r.total_points) AS total_points
                    FROM 
                        Rosters r
                    INNER JOIN 
                        Users u ON r.user_id = u.user_id
                    GROUP BY 
                        r.user_id, u.display_name
                    ORDER BY 
                        total_wins DESC, total_points DESC;
                    `;

        let results = [];
        const request = new Request(sql, (err) => {
            if (err) {
                console.error('Error executing SQL:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });

        request.on('row', (columns) => {
            let result = {};
            columns.forEach(column => {
                result[column.metadata.colName] = column.value;
            });
            results.push(result);
        });

        connection.execSql(request);
    });
}

// API endpoint to get standings
app.get('/standings', async (req, res) => {
    try {
        const standings = await calculateStandings();
        res.json(standings);
    } catch (error) {
        res.status(500).send('Error fetching standings');
    }
});

// Start the server
const PORT = 3000; // You can change the port number
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Connect to the database
connection.on('connect', (err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database.');
    }
});

connection.connect();