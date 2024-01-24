$(document).ready(function() {
    fetchStandings('985569785293467648', 1); // Example - replace with your leagueId and week

    function fetchStandings(leagueId, week) {
        $.get(`http://localhost:3000/api/standings/${leagueId}/${week}`, function(data) {
            console.log('HIT');
            console.log(data); // Log the data for debugging
            displayStandings(data);
        }).fail(function(error) {
            console.error("Error fetching standings:", error);
        });
    }

    function displayStandings(standings) {
        let html = '<table><tr><th>Team</th><th>Wins</th><th>Losses</th><th>Points</th></tr>';
        standings.forEach(team => {
            html += `<tr>
                    <td>${team.display_name}</td>
                    <td>${team.wins}</td>
                    <td>${team.losses}</td>
                    <td>${team.total_points}</td>
                 </tr>`;
        });
        html += '</table>';
        console.log(html); // Check the HTML string
        $('#standings').html(html);
    }

});