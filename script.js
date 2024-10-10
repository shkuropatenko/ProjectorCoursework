const API_KEY = "K7pQWboslVcDVfAKGbLo8pkfnbdVoMoR";

document.addEventListener("DOMContentLoaded", () => {
  renderHistory();
  fetchCountries();

  // Фільтр днів
  document
    .getElementById("dayFilter")
    .addEventListener("change", filterHolidays);

  // Додаємо слухачі подій для кнопок та полів вибору
  document.getElementById("startDate").addEventListener("input", validateDates);
  document.getElementById("endDate").addEventListener("input", validateDates);

  // Пресети
  document
    .getElementById("weekPreset")
    .addEventListener("click", () => setPreset("week"));
  document
    .getElementById("monthPreset")
    .addEventListener("click", () => setPreset("month"));

  // Обробка кліку для обчислення різниці між датами
  document
    .getElementById("calculateBtn")
    .addEventListener("click", calculateDateDifference);

  // Обробка вибору країни та року'
  document
    .getElementById("countrySelect")
    .addEventListener("change", enableYearSelect);
  document
    .getElementById("yearSelect")
    .addEventListener("change", fetchHolidays);

  // Обробка сортування свят
  document
    .getElementById("sortDateBtn")
    .addEventListener("click", sortHolidays);

  document
    .getElementById("fetchHolidaysBtn")
    .addEventListener("click", fetchHolidays);

  // Додаємо слухачі подій для табів
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => {
    button.addEventListener("click", (event) =>
      openTab(event, button.dataset.tab)
    );
  });

  // Відкриваємо першу вкладку за замовчуванням
  tabButtons[0].click();
});

// Функція для відкриття вкладки
function openTab(event, tabName) {
  // Скрыть все вкладки
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((tab) => {
    tab.style.display = "none";
  });

  // Убрать активный класс з усіх кнопок
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  // Показати вибрану вкладку
  document.getElementById(tabName).style.display = "block";
  event.currentTarget.classList.add("active");
}

// Функція валідації дат
function validateDates() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate");

  if (startDate) {
    endDate.disabled = false;
    endDate.min = startDate;
  } else {
    endDate.disabled = true;
    endDate.value = "";
  }
}

// встановлення пресетів
function setPreset(preset) {
  const startDate = new Date();
  const endDate = new Date(startDate);

  if (preset === "week") {
    endDate.setDate(startDate.getDate() + 7);
  } else if (preset === "month") {
    endDate.setMonth(startDate.getMonth() + 1);
  }

  document.getElementById("startDate").value = startDate
    .toISOString()
    .split("T")[0];
  document.getElementById("endDate").value = endDate
    .toISOString()
    .split("T")[0];
}

// обчислення різниці між датами
function calculateDateDifference() {
  const startDate = new Date(document.getElementById("startDate").value);
  const endDate = new Date(document.getElementById("endDate").value);
  const option = document.getElementById("countOption").value;

  if (startDate && endDate && startDate <= endDate) {
    const diffTime = endDate - startDate;
    let result;

    switch (option) {
      case "days":
        result = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        break;
      case "hours":
        result = Math.ceil(diffTime / (1000 * 60 * 60));
        break;
      case "minutes":
        result = Math.ceil(diffTime / (1000 * 60));
        break;
      case "seconds":
        result = Math.ceil(diffTime / 1000);
        break;
    }

    saveToHistory(startDate, endDate, result);
    // alert(`Результат: ${result} ${option}`);
  } else {
    alert("Неправильний діапазон дат.");
  }
}

// збереження історії обчислень
function saveToHistory(startDate, endDate, result) {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  history.unshift({ startDate, endDate, result });

  // 10 останніх записів
  if (history.length > 10) history.pop();

  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();
}

// Функція для відображення історії
function renderHistory() {
  const historyTableBody = document.querySelector("#historyTable tbody");
  historyTableBody.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("history")) || [];

  history.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${new Date(entry.startDate).toLocaleDateString()}</td>
       <td>${new Date(entry.endDate).toLocaleDateString()}</td>
       <td>${entry.result}</td>`;
    historyTableBody.appendChild(row);
  });
}

// Функція для отримання списку країн
function fetchCountries() {
  fetch(`https://calendarific.com/api/v2/countries?api_key=${API_KEY}`)
    .then((response) => response.json())
    .then((data) => {
      const countrySelect = document.getElementById("countrySelect");
      data.response.countries.forEach((country) => {
        const option = document.createElement("option");
        option.value = country["iso-3166"];
        option.textContent = country.country_name;
        countrySelect.appendChild(option);
      });
    })
    .catch((error) => {
      showError("Не вдалося отримати список країн.");
    });
}

// Функція для вибору року
function enableYearSelect() {
  const yearSelect = document.getElementById("yearSelect");
  yearSelect.disabled = false;

  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = "";

  for (let year = 2001; year <= 2049; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }

  yearSelect.value = currentYear;
}

function filterHolidays() {
  const filterOption = document.getElementById("dayFilter").value;
  const holidayRows = document.querySelectorAll("#holidayTable tbody tr");

  holidayRows.forEach((row) => {
    const dateText = row.cells[0].textContent;
    const date = new Date(dateText);
    const day = date.getDay();

    const isVisible =
      (filterOption === "weekdays" && day !== 0 && day !== 6) ||
      (filterOption === "weekends" && (day === 0 || day === 6));

    row.style.display = isVisible ? "" : "none";
  });
}

// Функція для отримання свят
function fetchHolidays() {
  const country = document.getElementById("countrySelect").value;
  const year = document.getElementById("yearSelect").value;

  if (!country || !year) {
    alert("Будь ласка, виберіть країну та рік.");
    return;
  }

  fetch(
    `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=${country}&year=${year}`
  )
    .then((response) => response.json())
    .then((data) => {
      const holidayTableBody = document.querySelector("#holidayTable tbody");
      holidayTableBody.innerHTML = "";

      data.response.holidays.forEach((holiday) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${new Date(
          holiday.date.iso
        ).toLocaleDateString()}</td>
           <td>${holiday.name}</td>`;
        holidayTableBody.appendChild(row);
      });
    })
    .catch((error) => {
      showError("Не вдалося отримати свята.");
    });
}

// Функція для сортування свят
function sortHolidays() {
  const holidayTableBody = document.querySelector("#holidayTable tbody");
  const rows = Array.from(holidayTableBody.querySelectorAll("tr"));
  const isAscending = holidayTableBody.dataset.sortOrder !== "asc";

  rows.sort((a, b) => {
    const dateA = new Date(a.cells[0].textContent);
    const dateB = new Date(b.cells[0].textContent);
    return isAscending ? dateA - dateB : dateB - dateA;
  });

  // Очищення таблиці та додавання відсортованих рядків
  holidayTableBody.innerHTML = "";
  rows.forEach((row) => holidayTableBody.appendChild(row));
  holidayTableBody.dataset.sortOrder = isAscending ? "asc" : "desc";
}

// Функція для відображення повідомлення про помилку
function showError(message) {
  const errorBlock = document.createElement("div");
  errorBlock.textContent = message;
  errorBlock.style.color = "red";
  document.body.insertBefore(errorBlock, document.body.firstChild);
}
