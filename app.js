// Data Structures
const LEVELS = [
    { min: 600, name: "Principal Engineer 2", pkg: "5CR" },
    { min: 560, name: "Principal Engineer 1", pkg: "3.5CR" },
    { min: 500, name: "Staff Engineer 2 / EM2", pkg: "2.4CR" },
    { min: 360, name: "Staff Engineer 1 / EM1", pkg: "1.8CR" },
    { min: 300, name: "SDE 5 (Senior 2)", pkg: "1.4CR" },
    { min: 250, name: "SDE 4 (Senior 1)", pkg: "1.1CR" },
    { min: 220, name: "SDE 3", pkg: "75L" },
    { min: 160, name: "SDE 2", pkg: "55L" },
    { min: 130, name: "SDE 1", pkg: "38L" },
    { min: 110, name: "Intern 2", pkg: "15L" },
    { min: 50, name: "Intern 1", pkg: "12L" },
    { min: 0, name: "New Graduate", pkg: "0" }
]; // Sorted descending for easier calculation

const POINT_SYSTEM = [
    { role: "Interviewee", points: 25 },
    { role: "TechMaster of the day", points: 20 },
    { role: "Interviewer", points: 20 },
    { role: "Winner Performer (Any)", points: 15 },
    { role: "Timer of the day", points: 10 },
    { role: "Winner Best Reviewer", points: 10 }
];

const ROLES_INFO = [
    {
        title: "TechMaster of the day",
        icon: "fa-solid fa-crown",
        desc: "Orchestrates the session, ensures smooth flow, handles introductions, sets the stage, and wraps up the daily interview prep community event."
    },
    {
        title: "Interviewer",
        icon: "fa-solid fa-user-tie",
        desc: "Conducts the mock interview, asks relevant technical/behavioral questions, evaluates the candidate strictly, and provides constructive feedback."
    },
    {
        title: "Interviewee",
        icon: "fa-solid fa-laptop-code",
        desc: "Participates as the candidate, solves the given problems, communicates thought process clearly, and handles follow-up challenges."
    },
    {
        title: "Timer of the day",
        icon: "fa-solid fa-stopwatch",
        desc: "Strictly keeps track of time for each segment of the session, ensuring nobody overruns and the overall schedule is maintained."
    },
    {
        title: "Winner Performer",
        icon: "fa-solid fa-medal",
        desc: "Awarded to the participant (Interviewer or Interviewee) demonstrating exceptional technical depth, preparation, and presentation during the session."
    },
    {
        title: "Winner Best Reviewer",
        icon: "fa-solid fa-star",
        desc: "Awarded to the community member providing the most insightful, constructive, and actionable peer feedback during the review phase."
    }
];

const EVENTS = [
    {
        date: "2026-03-21",
        theme: "-",
        interviewer1: "7",
        interviewee1: "9",
        topic1: "Design Youtube",
        interviewer2: "4",
        interviewee2: "5",
        topic2: "Design a Food Delivery App",
        tmOfTheDay: "9",
        timerOfTheDay: "9",
        winnerPerformer: "5",
        winnerReviewer: "-",
        icebreakers: ["7", "9", "4", "5"]
    },
    {
        date: "2026-04-01",
        theme: "Cricket",
        interviewer1: "17",
        interviewee1: "24",
        topic1: "Design a Cricket Streaming System",
        interviewer2: "20",
        interviewee2: "4",
        topic2: "Design a Fantasy Cricket Application / Sports Betting App",
        tmOfTheDay: "13", // Alice
        timerOfTheDay: "5", // Eve
        winnerPerformer: "9999", // TBD
        winnerReviewer: "9999", // TBD
        icebreakers: ["17", "24", "20"]
    }
];

// Edit this array to manually change the leaderboard contents
const MEMBERS = [
    { id: "0", name: "Atharsh", points: 0 },
    { id: "1", name: "Abarna", points: 0 },
    { id: "2", name: "Anbarasan", points: 0 },
    { id: "3", name: "Anil Kumawat", points: 0 },
    { id: "4", name: "Aravind Rajendran", points: 45 },
    { id: "5", name: "Bino", points: 40 },
    { id: "6", name: "Chandan Kumar", points: 0 },
    { id: "7", name: "Gaurav Mishra", points: 20 },
    { id: "8", name: "Greeshmanth Reddy", points: 0 },
    { id: "9", name: "Karthik", points: 25 },
    { id: "10", name: "Navin", points: 0 },
    { id: "11", name: "Nitish Adi Reddy", points: 0 },
    { id: "12", name: "Praveen", points: 0 },
    { id: "13", name: "Priyanka S", points: 20 },
    { id: "14", name: "PV", points: 0 },
    { id: "15", name: "Ram Kumar", points: 0 },
    { id: "16", name: "Ranjith", points: 0 },
    { id: "17", name: "Raushan", points: 20 },
    { id: "18", name: "Saptarshi", points: 0 },
    { id: "19", name: "Shashi", points: 0 },
    { id: "20", name: "Shrini", points: 20 },
    { id: "21", name: "Srujana", points: 0 },
    { id: "22", name: "Swati", points: 0 },
    { id: "23", name: "Thafsil", points: 0 },
    { id: "24", name: "Veeresh", points: 25 },
    { id: "25", name: "Bathri", points: 0 },
    { id: "26", name: "Arun S", points: 0 },
    { id: "27", name: "Anu", points: 0 },
    { id: "28", name: "Vishnu", points: 0 },
    { id: "29", name: "Madan", points: 0 },
    { id: "30", name: "Rekha", points: 0 },
    { id: "31", name: "Pramod", points: 0 },
    { id: "33", name: "Vishnu", points: 0 },
    { id: "34", name: "Venkatesh", points: 0 },
    { id: "34", name: "Manikandan", points: 0 },
    { id: "9999", name: "TBD", points: 0 }
];

// State
let members = MEMBERS;

// Helper: Get Member Badge by ID
function getMemberBadge(id) {
    const member = members.find(m => m.id === id);
    if (!member) return `<span class="member-badge"><span class="m-name">Unknown</span></span>`;

    // For non-participants like TBD or missing names
    if (member.name === "TBD" || member.name === "-") {
        return `<span class="member-badge"><span class="m-name">${member.name}</span></span>`;
    }

    return `
    <span class="member-badge">
        <span class="tm-prefix">TM</span>
        <span class="m-name">${member.name}</span>
        <span class="m-points">${member.points} pts</span>
    </span>`;
}

// Helper: Get Level from Points
function getLevel(points) {
    for (let lvl of LEVELS) {
        if (points >= lvl.min) return lvl;
    }
    return LEVELS[LEVELS.length - 1]; // Fallback to lowest
}

// Elements
const tabs = document.querySelectorAll('.nav-btn');
const panes = document.querySelectorAll('.tab-pane');
const leaderboardBody = document.getElementById('leaderboardBody');
const searchInput = document.getElementById('searchInput');

const membersGrid = document.getElementById('membersGrid');
const memberSearch = document.getElementById('memberSearch');

const eventsContainer = document.getElementById('eventsContainer');

const pointsList = document.getElementById('pointsList');
const levelsTimeline = document.getElementById('levelsTimeline');
const rolesGrid = document.getElementById('rolesGrid');

// Initialization
function init() {
    renderLeaderboard();
    renderMembers();
    renderEvents();
    renderPoints();
    renderLevels();
    renderRoles();
    setupEventListeners();
}

// Render logic
function renderLeaderboard(filter = "") {
    // Only show members actively earning points
    let activeMembers = members.filter(p => p.points > 0);

    // Sort descending by points, then by name alphabetically for ties
    let sorted = activeMembers.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.name.localeCompare(b.name);
    });

    if (filter) {
        sorted = sorted.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
    }

    leaderboardBody.innerHTML = '';

    if (sorted.length === 0) {
        leaderboardBody.innerHTML = `<div class="empty-state">No participants found.</div>`;
        return;
    }

    sorted.forEach((p, index) => {
        const lvl = getLevel(p.points);
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-standard';
        const initial = p.name.charAt(0).toUpperCase();

        const card = document.createElement('div');
        card.className = `leaderboard-card ${rankClass}`;
        card.innerHTML = `
            <div class="card-left">
                <div class="rank-badge">${rank}</div>
                <div class="participant-info">
                    <div class="avatar">${initial}</div>
                    <div class="participant-details">
                        <span class="p-name">TM ${p.name}</span>
                        <div class="p-meta">
                            <span class="level-badge">${lvl.name}</span>
                            <span class="ctc-badge">${lvl.pkg === '0' ? '' : lvl.pkg}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-right">
                <div class="points-display">
                    <span class="p-points">${p.points}</span>
                    <span class="p-pts-label">pts</span>
                </div>
            </div>
        `;
        leaderboardBody.appendChild(card);
    });
}

function renderMembers(filter = "") {
    let list = [...members].sort((a, b) => a.name.localeCompare(b.name));
    if (filter) {
        list = list.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
    }

    membersGrid.innerHTML = '';

    if (list.length === 0) {
        membersGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No members found.</div>`;
        return;
    }

    list.forEach(p => {
        const initial = p.name.charAt(0).toUpperCase();
        const roleText = p.points > 0 ? "Active Member" : "Member";

        membersGrid.innerHTML += `
            <div class="member-box">
                <div class="avatar">${initial}</div>
                <h3 style="color: white; font-size: 1.1rem; margin-bottom: 0;">TM ${p.name}</h3>
                <span class="m-points" style="color: var(--success); font-weight: 700; font-size: 0.9rem;">${p.points} pts</span>
                <span class="m-role-badge" style="margin-top: 5px;">${roleText}</span>
            </div>
        `;
    });
}

function renderEvents() {
    eventsContainer.innerHTML = '';

    if (EVENTS.length === 0) {
        eventsContainer.innerHTML = `<div class="empty-state">No events scheduled.</div>`;
        return;
    }

    EVENTS.forEach(ev => {
        const icebreakerNames = ev.icebreakers.map(id => getMemberBadge(id));
        const icebreakerHtml = icebreakerNames.length > 0
            ? `<div class="icebreaker"><i class="fa-solid fa-fire"></i> Icebreakers: <div class="badge-group">${icebreakerNames.join('')}</div></div>`
            : '';

        eventsContainer.innerHTML += `
            <div class="event-card">
                <div class="event-header">
                    <div class="event-title">${ev.theme}</div>
                    <div class="event-date"><i class="fa-regular fa-calendar"></i> ${ev.date}</div>
                </div>
                <div class="event-details-grid">
                    <div class="event-role-chip" style="grid-column: 1 / -1;">
                        <span class="event-role-label">Discussion 1</span>
                        <span class="event-role-value">
                            <i class="fa-solid fa-comments" style="color: var(--primary)"></i> 
                            <span style="display: flex; align-items: center; gap: 0.3rem; white-space: nowrap;">Interviewer: ${getMemberBadge(ev.interviewer1)}</span> 
                            <span style="color: var(--text-muted);">|</span> 
                            <span style="display: flex; align-items: center; gap: 0.3rem; white-space: nowrap;">Interviewee: ${getMemberBadge(ev.interviewee1)}</span>
                        </span>
                        <div class="event-topic">${ev.topic1}</div>
                    </div>
                    <div class="event-role-chip" style="grid-column: 1 / -1;">
                        <span class="event-role-label">Discussion 2</span>
                        <span class="event-role-value">
                            <i class="fa-solid fa-comments" style="color: var(--accent)"></i> 
                            <span style="display: flex; align-items: center; gap: 0.3rem; white-space: nowrap;">Interviewer: ${getMemberBadge(ev.interviewer2)}</span> 
                            <span style="color: var(--text-muted);">|</span> 
                            <span style="display: flex; align-items: center; gap: 0.3rem; white-space: nowrap;">Interviewee: ${getMemberBadge(ev.interviewee2)}</span>
                        </span>
                        <div class="event-topic">${ev.topic2}</div>
                    </div>
                    <div class="event-role-chip">
                        <span class="event-role-label">TM of the Day</span>
                        <span class="event-role-value"><i class="fa-solid fa-crown" style="color: var(--gold)"></i> ${getMemberBadge(ev.tmOfTheDay)}</span>
                    </div>
                    <div class="event-role-chip">
                        <span class="event-role-label">Timer</span>
                        <span class="event-role-value"><i class="fa-solid fa-stopwatch" style="color: var(--danger)"></i> ${getMemberBadge(ev.timerOfTheDay)}</span>
                    </div>
                    <div class="event-role-chip">
                        <span class="event-role-label">Winner Performer</span>
                        <span class="event-role-value"><i class="fa-solid fa-medal" style="color: var(--gold)"></i> ${getMemberBadge(ev.winnerPerformer)}</span>
                    </div>
                    <div class="event-role-chip">
                        <span class="event-role-label">Winner Reviewer</span>
                        <span class="event-role-value"><i class="fa-solid fa-star" style="color: var(--gold)"></i> ${getMemberBadge(ev.winnerReviewer)}</span>
                    </div>
                </div>
                ${icebreakerHtml}
            </div>
        `;
    });
}

function renderPoints() {
    pointsList.innerHTML = POINT_SYSTEM.map(p => `
        <li>
            <span class="role-name">${p.role}</span>
            <span class="points-val">+${p.points} pts</span>
        </li>
    `).join('');
}

function renderLevels() {
    // Render from bottom to top
    const ascLevels = [...LEVELS].reverse();
    levelsTimeline.innerHTML = ascLevels.map((l, i) => {
        return `
        <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="level-info">
                <div class="level-header">
                    <span class="level-name">${l.name}</span>
                    <span class="level-pkg">${l.pkg === '0' ? '' : l.pkg + ' Eqv'}</span>
                </div>
                <div class="level-req">Required Points: ${l.min}</div>
            </div>
        </div>
        `;
    }).join('');
}

function renderRoles() {
    rolesGrid.innerHTML = ROLES_INFO.map(r => `
        <div class="role-card">
            <div class="role-icon"><i class="${r.icon}"></i></div>
            <h3>${r.title}</h3>
            <p>${r.desc}</p>
        </div>
    `).join('');
}

// Event Listeners
function setupEventListeners() {
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        renderLeaderboard(e.target.value);
    });

    // Search Members
    memberSearch.addEventListener('input', (e) => {
        renderMembers(e.target.value);
    });
}

// Start
document.addEventListener('DOMContentLoaded', init);
