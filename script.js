import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAOh-D6OMwrTu3IWfarKo0nh4bt3LeaXlI",
  authDomain: "raspberrydata-41e99.firebaseapp.com",
  databaseURL: "https://raspberrydata-41e99-default-rtdb.firebaseio.com",
  projectId: "raspberrydata-41e99",
  storageBucket: "raspberrydata-41e99.appspot.com",
  messagingSenderId: "161208007104",
  appId: "1:161208007104:web:d0f4d7ca61f4e37f33f025"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'person_detection');

// DOM Elements
const dataTable = document.getElementById("dataTable").querySelector("tbody");
const violationsGraph = document.getElementById("violationsGraph");

// Data for the graph
let graphLabels = [];
let graphData = [];

// Function to update the table with real-time data
function updateTable(snapshot) {
    const data = snapshot.val();

    if (!data) {
        dataTable.innerHTML = `<tr><td colspan="5" style="text-align: center;">No data available</td></tr>`;
        return;
    }

    // Clear the table
    dataTable.innerHTML = "";

    // Convert object to array and sort by timestamp (latest first)
    const entries = Object.values(data).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Update table and graph data
    graphLabels = [];
    graphData = [];

    entries.forEach((entry, index) => {
        // Calculate mask count (subtracting no_mask_count from total people count)
        const maskWorn = entry.people_count - entry.no_mask_count;

        // Add row to the table
        const row = `<tr>
            <td>${entry.timestamp}</td>
            <td>${entry.area}</td>
            <td>${entry.people_count}</td>
            <td>${entry.violations}</td>
            <td>${maskWorn} / ${entry.people_count}</td> <!-- Showing mask worn count and total people -->
        </tr>`;
        dataTable.innerHTML += row;

        // Update graph data (limit to last 10 entries)
        if (index < 10) {
            graphLabels.unshift(entry.timestamp.split(" ")[1]); // Use only the time part
            graphData.unshift(entry.violations);
        }
    });

    // Update the graph
    updateGraph();
}

// Function to render or update the graph
function updateGraph() {
    if (window.violationChart) {
        window.violationChart.destroy(); // Destroy the old chart
    }

    window.violationChart = new Chart(violationsGraph, {
        type: "line",
        data: {
            labels: graphLabels,
            datasets: [
                {
                    label: "Social Distancing Violations",
                    data: graphData,
                    borderColor: "rgba(255, 99, 132, 1)",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Time",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Violations",
                    },
                    beginAtZero: true,
                },
            },
        },
    });
}

// Fetch live data from Firebase
onValue(dbRef, updateTable, (error) => {
    console.error("Error fetching data from Firebase:", error);
});
