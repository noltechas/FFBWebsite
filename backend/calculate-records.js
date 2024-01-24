const axios = require('axios');

// Function to fetch matchups from Sleeper API for a given week
async function fetchMatchups(leagueId, week) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching matchups for week ${week}:`, error);
        return [];
    }
}

// Function to fetch user information for a league
async function fetchUsers(leagueId) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/users`;
    try {
        const response = await axios.get(url);
        //console.log("User Data:", JSON.stringify(response.data, null, 2)); // Log the full response data
        return response.data;
    } catch (error) {
        console.error(`Error fetching users for league ${leagueId}:`, error);
        return [];
    }
}

async function fetchRosters(leagueId) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/rosters`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching rosters for league ${leagueId}:`, error);
        return [];
    }
}

// Function to calculate the median of an array of numbers
function calculateMedian(numbers) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return (sorted.length % 2 !== 0) ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Function to process the matchups and calculate records
async function calculateRecords(leagueId, totalWeeks, rosterToUserMap, userMap) {
    const records = {};

    for (let week = 1; week <= totalWeeks; week++) {
        const matchups = await fetchMatchups(leagueId, week);
        const weeklyScores = matchups.map(m => m.points);
        const medianScore = calculateMedian(weeklyScores);

        matchups.forEach(matchup => {
            const rosterId = matchup.roster_id;
            const points = matchup.points;

            if (!records[rosterId]) {
                records[rosterId] = { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 };
            }

            records[rosterId].pointsFor += points;

            // Find opponent in the same matchup
            const opponent = matchups.find(m => m.roster_id !== rosterId && m.matchup_id === matchup.matchup_id);
            if (opponent) {
                records[rosterId].pointsAgainst += opponent.points;

                // Regular matchup win/loss/tie
                if (points > opponent.points) {
                    records[rosterId].wins++;
                } else if (points < opponent.points) {
                    records[rosterId].losses++;
                } else {
                    records[rosterId].ties++;
                }
            }

            // Median matchup win/loss
            if (points > medianScore || (points === medianScore && weeklyScores.length % 2 === 0)) {
                records[rosterId].wins++;
            } else {
                records[rosterId].losses++;
            }
        });
    }

    // Use the userMap to replace rosterId with team names
    for (const rosterId in records) {
        if (records.hasOwnProperty(rosterId)) {
            const userId = rosterToUserMap[rosterId];
            const teamName = userMap[userId] || 'Unknown Team';
            console.log(`Team: ${teamName}, Wins: ${records[rosterId].wins}, Losses: ${records[rosterId].losses}, Ties: ${records[rosterId].ties}`);
        }
    }
}

async function calculateHypotheticalRecords(leagueId, totalWeeks, rosterToUserMap, userMap) {
    const records = {};

    for (let week = 1; week <= totalWeeks; week++) {
        const matchups = await fetchMatchups(leagueId, week);
        const weeklyScores = matchups.map(m => ({ rosterId: m.roster_id, points: m.points }));

        weeklyScores.forEach(currentTeam => {
            if (!records[currentTeam.rosterId]) {
                records[currentTeam.rosterId] = { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 };
            }
            records[currentTeam.rosterId].pointsFor += currentTeam.points;

            // Compare with every other team
            weeklyScores.forEach(opponentTeam => {
                if (currentTeam.rosterId !== opponentTeam.rosterId) {
                    if (currentTeam.points > opponentTeam.points) {
                        records[currentTeam.rosterId].wins++;
                    } else if (currentTeam.points < opponentTeam.points) {
                        records[currentTeam.rosterId].losses++;
                    } else {
                        records[currentTeam.rosterId].ties++;
                    }
                }
            });
        });
    }

    // Use the userMap to replace rosterId with team names
    for (const rosterId in records) {
        if (records.hasOwnProperty(rosterId)) {
            const userId = rosterToUserMap[rosterId];
            const teamName = userMap[userId] || 'Unknown Team';
            console.log(`Team: ${teamName}, Wins: ${records[rosterId].wins}, Losses: ${records[rosterId].losses}, Ties: ${records[rosterId].ties}`);
        }
    }
}

async function main() {
    const leagueId = '985569785293467648'; // Replace with your league ID
    const totalWeeks = 12; // Replace with the total number of weeks in your league

    const users = await fetchUsers(leagueId);
    const rosters = await fetchRosters(leagueId);

    // Only proceed if users and rosters are arrays
    if (Array.isArray(users) && Array.isArray(rosters)) {
        const rosterToUserMap = rosters.reduce((map, roster) => {
            map[roster.roster_id] = roster.owner_id;
            return map;
        }, {});

        const userMap = users.reduce((map, user) => {
            map[user.user_id] = user.metadata && user.metadata.team_name ? user.metadata.team_name : user.display_name;
            return map;
        }, {});

        const records = await calculateHypotheticalRecords(leagueId, totalWeeks, rosterToUserMap, userMap);
    } else {
        console.error("Error: Users or Rosters data is not in the expected format");
    }
}

main();
