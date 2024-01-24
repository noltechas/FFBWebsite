const express = require('express');
const path = require('path');
const tedious = require('tedious');

const app = express();
const port = 3000;

// Database connection configuration
const config = {
    authentication: {
        type: 'default',
        options: {
            userName: 'darockyrock',
            password: 'kaxfam-nuxqAt-juzpo9',
        },
    },
    server: 'odyssey-fantasy-server.database.windows.net',
    options: {
        database: 'Users',
        encrypt: true,
    },
};

const connection = new tedious.Connection(config);

// Connect to the database
connection.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database.');
    }
});

// Function to execute SQL query for standings
async function getStandingsFromDatabase(leagueId, week) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                u.display_name, 
                r.wins, 
                r.losses, 
                SUM(m.points) as total_points 
            FROM 
                Matchups m 
                INNER JOIN Rosters r ON m.roster_id = r.roster_id 
                INNER JOIN Users u ON r.user_id = u.user_id
            WHERE 
                m.league_id = @leagueId 
                AND m.week <= @week
            GROUP BY 
                u.display_name, 
                r.wins, 
                r.losses
            ORDER BY 
                r.wins DESC, 
                total_points DESC;
        `;
        const request = new tedious.Request(sql, (err, rowCount, rows) => {
            if (err) {
                console.error('Error executing SQL:', err);
                reject(err);
            } else {
                // Transform the rows into a more friendly format
                const results = rows.map(row => {
                    let result = {};
                    row.forEach(column => {
                        result[column.metadata.colName] = column.value;
                    });
                    return result;
                });
                resolve(results);
            }
        });

        // Set parameters for the SQL query
        request.addParameter('leagueId', tedious.TYPES.NVarChar, leagueId);
        request.addParameter('week', tedious.TYPES.Int, week);

        // Execute the query
        connection.execSql(request);
    });
}

app.get('/api/standings/:leagueId/:week', async (req, res) => {
    try {
        const { leagueId, week } = req.params;
        const standings = await calculateStandings(leagueId, week);
        res.json(standings);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
