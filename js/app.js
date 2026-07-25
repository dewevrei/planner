"use strict";

const STORAGE_KEY = "skala-planner";

let filter = "all";

let goals = loadGoals();

const form = document.getElementById("goal-form");
const input = document.getElementById("goal-input");
const category = document.getElementById("goal-category");
const dueDate = document.getElementById("goal-due-date");
const listEl = document.getElementById("goal-list");
const emptyEl = document.getElementById("list-empty");
const errorEl = document.getElementById("form-error");
const tabsEl = document.getElementById("filter-tabs");
const fillEl = document.getElementById("progress-fill");
const textEl = document.getElementById("progress-text");

/* 
    LocalStorage에서 Goals를 로드하는 함수
*/
function loadGoals() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if(saved == null) {
            return [];
        }
        
        const parsed = JSON.parse(saved);

        if(!Array.isArray(parsed)) {
            return [];
        }

        return parsed;
    } catch(error) {
        console.error("LocalStorage에서 데이터를 읽을 수 없습니다.", error);
        return [];
    }
}
/* 
    LocalStorage에서 Goals를 저장하는 함수
*/
function saveGoals() {
    try {
        const data = JSON.stringify(goals);
        localStorage.setItem(STORAGE_KEY, data);
    } catch(error) {
        console.error("LocalStorage 저장에 실패했습니다.", error);
    }
}

function removeGoals(id) {
    goals = goals.filter((g) => String(g.id) !== id);

    saveGoals();
    render();
}

function createId() {
    return `${Date.now()}`;
}

/*
goals.push({id: Date.now(), title: title, category: category.value, done: false});
*/

function createGoal(title, category, deadline) {
    return {
        id: createId(),
        title: title,
        category: category,
        dueDate: deadline,
        done: false
    };
}

function addGoal(title, category, deadline) {
    const goal = createGoal(title, category, deadline);
    goals.push(goal);

    saveGoals();

    render();
}

function updateProgress() {
    const total = goals.length;
    const done = goals.filter(goal => goal.done).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    fillEl.style.width = percent + "%";
    textEl.textContent = `전체 ${total}개 중 ${done}개 완료 (${percent}%)`;
}

function visible() {
    if(filter === "active") return goals.filter((g) => !g.done);
    if(filter === "done") return goals.filter((g) => g.done);
    return goals;
}

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isOverdue(goal) {
    return !goal.done && Boolean(goal.dueDate) && goal.dueDate < getToday();
}

function formatDueDate(deadline) {
    const [year, month, day] = deadline.split("-");
    return `마감 ${year}.${Number(month)}.${Number(day)}`;
}

function render() {
    const items = visible();
    listEl.replaceChildren();
    items.forEach((goal) => {
        const li = document.createElement("li");
        li.className = "item";
        li.classList.toggle("is-done", goal.done);
        li.classList.toggle("is-overdue", isOverdue(goal));
        li.dataset.id = goal.id;

        const label = document.createElement("label");
        label.className = "item-main";

        const checkbox = document.createElement("input");
        checkbox.className = "item-check";
        checkbox.type = "checkbox";
        checkbox.checked = goal.done;

        const title = document.createElement("span");
        title.className = "item-text";
        title.textContent = goal.title;

        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = goal.category;

        const meta = document.createElement("div");
        meta.className = "item-meta";
        meta.appendChild(badge);

        if(goal.dueDate) {
            const deadline = document.createElement("time");
            deadline.className = "item-due";
            deadline.dateTime = goal.dueDate;
            deadline.textContent = formatDueDate(goal.dueDate);
            meta.appendChild(deadline);
        }

        const deleteButton = document.createElement("button");
        deleteButton.className = "item-delete";
        deleteButton.type = "button";
        deleteButton.setAttribute("aria-label", `${goal.title} 삭제`);
        deleteButton.textContent = "×";

        label.append(checkbox, title);
        li.append(label, meta, deleteButton);
        listEl.appendChild(li);
    });
    emptyEl.hidden = items.length > 0;
    updateProgress();
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = input.value.trim();
    const cat = category.value.trim();
    const deadline = dueDate.value;
    if(title === "") {
        errorEl.hidden = false;
        input.focus();
        return;
    }
    errorEl.hidden = true;
    addGoal(title, cat, deadline);
    input.value="";
    dueDate.value="";
});

listEl.addEventListener("click", (event) => {
    const li = event.target.closest(".item");
    if(!li) return;
    const id = li.dataset.id;
    if(event.target.matches(".item-check")) {
        const goal = goals.find((g) => String(g.id) === id);
        goal.done = event.target.checked;
        saveGoals();
        render();
    }
    if(event.target.matches(".item-delete")) {
        removeGoals(id);
    }
});

tabsEl.addEventListener("click", (event) => {
    const tab = event.target.closest(".tab");
    if(!tab) return;
    filter = tab.dataset.filter;
    document.querySelectorAll(".tab").forEach((t) => {
        t.classList.toggle("is-active", t === tab);
    });
    render();
});

async function loadTip() {
    const tipEl = document.getElementById("tip");

    try {
        const response = await fetch("data/tips.json");
        if(!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const tips = await response.json();
        const today = new Date().getDate() % tips.length;
        tipEl.textContent = tips[today];
    } catch(error) {
        tipEl.textContent = "팁을 불러오지 못했습니다.";
        console.error(error);
    }
}

render();
loadTip();
