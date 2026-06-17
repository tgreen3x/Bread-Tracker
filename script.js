const transactionForm = document.getElementById("transaction-form");
const detailsInput = document.getElementById("details");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const savingsGoalSelect = document.getElementById("savings-goal-select");
const dateInput = document.getElementById("date");
const nativeDatePickers = document.querySelectorAll('input[type="date"], input[type="month"]');

const overviewMonthInput = document.getElementById("overview-month");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expensesElement = document.getElementById("expenses");
const savingsBankElement = document.getElementById("savings-bank");
const transactionList = document.getElementById("transaction-list");
const emptyMessage = document.getElementById("empty-message");

const searchInput = document.getElementById("search-input");
const filterTypeInput = document.getElementById("filter-type");
const filterCategoryInput = document.getElementById("filter-category");
const filterMonthInput = document.getElementById("filter-month");
const sortTransactionsInput = document.getElementById("sort-transactions");
const resetFiltersButton = document.getElementById("reset-filters-btn");

const formTitle = document.getElementById("form-title");
const submitButton = document.getElementById("submit-btn");
const cancelEditButton = document.getElementById("cancel-edit-btn");

const exportCsvButton = document.getElementById("export-csv-btn");
const clearAllButton = document.getElementById("clear-all-btn");

const categoryChart = document.getElementById("category-chart");
const chartContext = categoryChart.getContext("2d");

const categoryLimitForm = document.getElementById("category-limit-form");
const limitCategoryInput = document.getElementById("limit-category");
const limitAmountInput = document.getElementById("limit-amount");
const categoryLimitsList = document.getElementById("category-limits-list");

const savingsGoalForm = document.getElementById("savings-goal-form");
const savingsGoalNameInput = document.getElementById("savings-goal-name");
const savingsGoalTargetInput = document.getElementById("savings-goal-target");
const savingsGoalsList = document.getElementById("savings-goals-list");
const totalSavingsBankElement = document.getElementById("total-savings-bank");
const allocatedSavingsElement = document.getElementById("allocated-savings");
const unassignedSavingsElement = document.getElementById("unassigned-savings");

const recurringBillForm = document.getElementById("recurring-bill-form");
const recurringDetailsInput = document.getElementById("recurring-details");
const recurringAmountInput = document.getElementById("recurring-amount");
const recurringCategoryInput = document.getElementById("recurring-category");
const recurringDueDateInput = document.getElementById("recurring-due-date");
const recurringBillsList = document.getElementById("recurring-bills-list");

const insightsList = document.getElementById("insights-list");

const reportMonthElement = document.getElementById("report-month");
const reportIncomeElement = document.getElementById("report-income");
const reportExpensesElement = document.getElementById("report-expenses");
const reportSavingsElement = document.getElementById("report-savings");
const reportNetElement = document.getElementById("report-net");
const reportTopCategoryElement = document.getElementById("report-top-category");
const reportRecurringElement = document.getElementById("report-recurring");
const reportFutureBillsElement = document.getElementById("report-future-bills");

const futureBillsList = document.getElementById("future-bills-list");
const monthlyBreakdownList = document.getElementById("monthly-breakdown-list");

const snarkMessageElement = document.getElementById("snark-message");

const categories = [
  "Salary",
  "Freelance",
  "Food",
  "Rent",
  "Transportation",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other"
];

let transactions = [];
let categoryLimits = {};
let savingsGoals = [];
let recurringBills = [];
let editingTransactionId = null;

loadFromLocalStorage();
setupNativeDatePickers();
populateCategorySelects();
populateSavingsGoalSelect();
overviewMonthInput.value = getCurrentMonth();
updateTransactionFormMode();
updateDisplay();


function setupNativeDatePickers() {
  nativeDatePickers.forEach(function (input) {
    input.setAttribute("inputmode", "none");
    input.setAttribute("autocomplete", "off");

    input.addEventListener("click", openNativePicker);
    input.addEventListener("focus", openNativePicker);

    input.addEventListener("keydown", function (event) {
      const allowedKeys = [
        "Tab",
        "Shift",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Enter",
        "Escape"
      ];

      if (allowedKeys.includes(event.key)) {
        return;
      }

      event.preventDefault();
      openNativePicker({ currentTarget: input });
    });

    input.addEventListener("paste", function (event) {
      event.preventDefault();
    });
  });
}

function openNativePicker(event) {
  const input = event.currentTarget;

  if (typeof input.showPicker !== "function") {
    return;
  }

  try {
    input.showPicker();
  } catch (error) {
    // Some browsers only allow the picker to open from a direct user action.
  }
}

transactionForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const details = detailsInput.value.trim();
  const amount = Number(amountInput.value);
  const type = typeInput.value;
  const category = type === "savings" ? "Savings" : categoryInput.value;
  const savingsGoalId = type === "savings" ? savingsGoalSelect.value : "";
  const date = dateInput.value;

  if (amount <= 0) {
    alert("Please enter an amount greater than $0.");
    return;
  }

  if (date === "") {
    alert("Please choose a date.");
    return;
  }

  if (editingTransactionId) {
    updateExistingTransaction(details, amount, type, category, savingsGoalId, date);
  } else {
    addNewTransaction(details, amount, type, category, savingsGoalId, date);

    if (type === "expense") {
      generateSnark(amount, category, details);
    }

    if (type === "savings") {
      generateSavingsMessage(amount, savingsGoalId);
    }
  }

  saveToLocalStorage();
  resetForm();
  updateDisplay();
});

typeInput.addEventListener("change", updateTransactionFormMode);
overviewMonthInput.addEventListener("change", updateDisplay);
searchInput.addEventListener("input", updateDisplay);
filterTypeInput.addEventListener("change", updateDisplay);
filterCategoryInput.addEventListener("change", updateDisplay);
filterMonthInput.addEventListener("change", updateDisplay);
sortTransactionsInput.addEventListener("change", updateDisplay);

resetFiltersButton.addEventListener("click", function () {
  resetFilters();
  updateDisplay();
});

cancelEditButton.addEventListener("click", resetForm);

exportCsvButton.addEventListener("click", exportTransactionsToCSV);

clearAllButton.addEventListener("click", function () {
  const confirmed = confirm("Are you sure you want to delete all transactions, recurring bills, limits, and savings goals?");

  if (!confirmed) {
    return;
  }

  clearAllData();
});

categoryLimitForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const category = limitCategoryInput.value;
  const amount = Number(limitAmountInput.value);

  if (amount <= 0) {
    alert("Please enter a limit greater than $0.");
    return;
  }

  categoryLimits[category] = amount;
  limitAmountInput.value = "";

  saveToLocalStorage();
  updateDisplay();
});

savingsGoalForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = savingsGoalNameInput.value.trim();
  const target = Number(savingsGoalTargetInput.value);

  if (name === "") {
    alert("Please enter a savings goal name.");
    return;
  }

  if (target <= 0) {
    alert("Please enter a target greater than $0.");
    return;
  }

  const alreadyExists = savingsGoals.some(function (goal) {
    return goal.name.toLowerCase() === name.toLowerCase();
  });

  if (alreadyExists) {
    alert("That savings goal already exists.");
    return;
  }

  savingsGoals.push({
    id: Date.now(),
    name: name,
    target: target
  });

  savingsGoalNameInput.value = "";
  savingsGoalTargetInput.value = "";

  populateSavingsGoalSelect();
  saveToLocalStorage();
  updateDisplay();
});

recurringBillForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const details = recurringDetailsInput.value.trim();
  const amount = Number(recurringAmountInput.value);
  const category = recurringCategoryInput.value;
  const dueDate = recurringDueDateInput.value;
  const day = dueDate ? Number(dueDate.slice(8, 10)) : 0;

  if (details === "") {
    alert("Please enter the recurring bill name.");
    return;
  }

  if (amount <= 0) {
    alert("Please enter an amount greater than $0.");
    return;
  }

  if (!dueDate || day < 1 || day > 31) {
    alert("Please choose a due date from the calendar.");
    return;
  }

  recurringBills.push({
    id: Date.now(),
    details: details,
    amount: amount,
    category: category,
    day: day
  });

  recurringBillForm.reset();

  saveToLocalStorage();
  updateDisplay();
});

function addNewTransaction(details, amount, type, category, savingsGoalId, date) {
  transactions.push({
    id: Date.now(),
    details: details,
    amount: amount,
    type: type,
    category: category,
    savingsGoalId: savingsGoalId,
    date: date
  });
}

function updateExistingTransaction(details, amount, type, category, savingsGoalId, date) {
  transactions = transactions.map(function (transaction) {
    if (transaction.id === editingTransactionId) {
      return {
        id: transaction.id,
        details: details,
        amount: amount,
        type: type,
        category: category,
        savingsGoalId: savingsGoalId,
        date: date
      };
    }

    return transaction;
  });
}

function updateDisplay() {
  const selectedMonth = overviewMonthInput.value || getCurrentMonth();
  const overviewTransactions = getMonthlyTransactions(selectedMonth);
  const filteredTransactions = getFilteredTransactions();
  const sortedTransactions = sortTransactions(filteredTransactions);

  updateSummary(overviewTransactions);
  renderTransactions(sortedTransactions);
  renderMonthlyReport(selectedMonth, overviewTransactions);
  drawCategoryChart(overviewTransactions);
  renderCategoryLimits(selectedMonth);
  renderSavingsGoals();
  renderRecurringBills();
  renderFutureBills(selectedMonth);
  renderMonthlyBreakdown();
  renderInsights(overviewTransactions);
}

function getFilteredTransactions() {
  const searchText = searchInput.value.toLowerCase();
  const selectedType = filterTypeInput.value;
  const selectedCategory = filterCategoryInput.value;
  const selectedMonth = filterMonthInput.value;
  const baseTransactions = selectedMonth
    ? getMonthlyTransactions(selectedMonth)
    : transactions;

  return baseTransactions.filter(function (transaction) {
    const details = transaction.details || "";
    const savingsGoalName = getSavingsGoalName(transaction.savingsGoalId);

    const matchesSearch =
      details.toLowerCase().includes(searchText) ||
      transaction.category.toLowerCase().includes(searchText) ||
      savingsGoalName.toLowerCase().includes(searchText);

    const matchesType = selectedType === "all" || transaction.type === selectedType;
    const matchesCategory = selectedCategory === "all" || transaction.category === selectedCategory;
    const transactionMonth = transaction.date.slice(0, 7);
    const matchesMonth = selectedMonth === "" || transactionMonth === selectedMonth;

    return matchesSearch && matchesType && matchesCategory && matchesMonth;
  });
}

function sortTransactions(filteredTransactions) {
  const sortValue = sortTransactionsInput.value;
  const sorted = [...filteredTransactions];

  if (sortValue === "newest") {
    sorted.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  }

  if (sortValue === "oldest") {
    sorted.sort(function (a, b) {
      return new Date(a.date) - new Date(b.date);
    });
  }

  if (sortValue === "highest") {
    sorted.sort(function (a, b) {
      return b.amount - a.amount;
    });
  }

  if (sortValue === "lowest") {
    sorted.sort(function (a, b) {
      return a.amount - b.amount;
    });
  }

  if (sortValue === "income-first") {
    sorted.sort(function (a, b) {
      return getTypeRank(a.type, "income") - getTypeRank(b.type, "income");
    });
  }

  if (sortValue === "expense-first") {
    sorted.sort(function (a, b) {
      return getTypeRank(a.type, "expense") - getTypeRank(b.type, "expense");
    });
  }

  if (sortValue === "savings-first") {
    sorted.sort(function (a, b) {
      return getTypeRank(a.type, "savings") - getTypeRank(b.type, "savings");
    });
  }

  return sorted;
}

function getTypeRank(type, firstType) {
  if (type === firstType) {
    return 0;
  }

  if (type === "income") {
    return 1;
  }

  if (type === "expense") {
    return 2;
  }

  return 3;
}

function renderTransactions(filteredTransactions) {
  transactionList.innerHTML = "";

  if (filteredTransactions.length === 0) {
    emptyMessage.classList.remove("hidden");
  } else {
    emptyMessage.classList.add("hidden");
  }

  filteredTransactions.forEach(function (transaction) {
    const listItem = document.createElement("li");

    listItem.classList.add("transaction");
    listItem.classList.add(transaction.type);

    if (transaction.recurring) {
      listItem.classList.add("recurring-transaction");
    }

    const amountSign = transaction.type === "income" ? "+" : "-";
    const formattedDate = formatDate(transaction.date);
    const details = transaction.details || "";
    const typeLabel = transaction.recurring ? "RECURRING BILL" : transaction.type.toUpperCase();

    let title = transaction.category;

    if (transaction.type === "savings") {
      const goalName = getSavingsGoalName(transaction.savingsGoalId);
      title = goalName ? `Savings → ${goalName}` : "Savings → Unassigned";
    }

    const detailsHTML = details
      ? `<span class="transaction-details">${escapeHTML(details)}</span>`
      : `<span class="transaction-details muted">No details entered.</span>`;

    const actionButtons = transaction.recurring
      ? `<button class="edit-btn" onclick="scrollToRecurringBills()">Manage</button>`
      : `
        <button class="edit-btn" onclick="editTransaction(${transaction.id})">Edit</button>
        <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Delete</button>
      `;

    listItem.innerHTML = `
      <div class="transaction-main">
        <span class="transaction-title">${escapeHTML(title)}</span>
        <span class="transaction-meta">${typeLabel} • ${formattedDate}</span>
        ${detailsHTML}
      </div>

      <div class="transaction-side">
        <span class="transaction-amount">${amountSign}$${transaction.amount.toFixed(2)}</span>
        <div class="transaction-actions">
          ${actionButtons}
        </div>
      </div>
    `;

    transactionList.appendChild(listItem);
  });
}

function updateSummary(transactionSet) {
  const totals = calculateTotals(transactionSet);

  incomeElement.textContent = `$${totals.income.toFixed(2)}`;
  expensesElement.textContent = `$${totals.expenses.toFixed(2)}`;
  savingsBankElement.textContent = `$${totals.savings.toFixed(2)}`;
  balanceElement.textContent = `$${totals.spendable.toFixed(2)}`;
}

function calculateTotals(transactionSet) {
  let income = 0;
  let expenses = 0;
  let savings = 0;

  transactionSet.forEach(function (transaction) {
    if (transaction.type === "income") {
      income += transaction.amount;
    } else if (transaction.type === "expense") {
      expenses += transaction.amount;
    } else if (transaction.type === "savings") {
      savings += transaction.amount;
    }
  });

  return {
    income: income,
    expenses: expenses,
    savings: savings,
    spendable: income - expenses - savings
  };
}

function renderMonthlyReport(selectedMonth, monthlyTransactions) {
  const totals = calculateTotals(monthlyTransactions);
  const spendingByCategory = {};
  const recurringTotal = getRecurringTransactionsForMonth(selectedMonth).reduce(function (total, bill) {
    return total + bill.amount;
  }, 0);
  const futureTotal = getFutureBills(selectedMonth).reduce(function (total, bill) {
    return total + bill.amount;
  }, 0);

  monthlyTransactions.forEach(function (transaction) {
    if (transaction.type === "expense") {
      if (!spendingByCategory[transaction.category]) {
        spendingByCategory[transaction.category] = 0;
      }

      spendingByCategory[transaction.category] += transaction.amount;
    }
  });

  const topCategory = getTopSpendingCategory(spendingByCategory);

  reportMonthElement.textContent = formatMonth(selectedMonth);
  reportIncomeElement.textContent = `$${totals.income.toFixed(2)}`;
  reportExpensesElement.textContent = `$${totals.expenses.toFixed(2)}`;
  reportSavingsElement.textContent = `$${totals.savings.toFixed(2)}`;
  reportNetElement.textContent = `$${totals.spendable.toFixed(2)}`;
  reportTopCategoryElement.textContent = topCategory ? topCategory.category : "None";
  reportRecurringElement.textContent = `$${recurringTotal.toFixed(2)}`;
  reportFutureBillsElement.textContent = `$${futureTotal.toFixed(2)}`;
}

function renderCategoryLimits(selectedMonth) {
  categoryLimitsList.innerHTML = "";

  const limitCategories = Object.keys(categoryLimits);

  if (limitCategories.length === 0) {
    categoryLimitsList.innerHTML = `
      <div class="empty-message">
        No category limits set yet.
      </div>
    `;
    return;
  }

  limitCategories.forEach(function (category) {
    const limit = categoryLimits[category];
    const spent = getCategorySpendingForMonth(category, selectedMonth);
    const percent = Math.min((spent / limit) * 100, 100);

    let progressClass = "";

    if (percent >= 100) {
      progressClass = "danger";
    } else if (percent >= 80) {
      progressClass = "warning";
    }

    const item = document.createElement("div");
    item.classList.add("category-limit-item");

    item.innerHTML = `
      <div class="category-limit-main">
        <span class="category-limit-title">${escapeHTML(category)}</span>
        <span class="category-limit-meta">
          ${formatMonth(selectedMonth)}: spent $${spent.toFixed(2)} of $${limit.toFixed(2)}
        </span>

        <div class="mini-progress">
          <div
            class="mini-progress-fill ${progressClass}"
            style="width: ${percent}%"
          ></div>
        </div>
      </div>

      <button class="remove-limit-btn" onclick="removeCategoryLimit('${escapeAttribute(category)}')">
        Remove
      </button>
    `;

    categoryLimitsList.appendChild(item);
  });
}

function renderSavingsGoals() {
  savingsGoalsList.innerHTML = "";

  const totalSavings = getTotalSavingsBank();
  const allocatedSavings = getAllocatedSavingsTotal();
  const unassignedSavings = totalSavings - allocatedSavings;

  totalSavingsBankElement.textContent = `$${totalSavings.toFixed(2)}`;
  allocatedSavingsElement.textContent = `$${allocatedSavings.toFixed(2)}`;
  unassignedSavingsElement.textContent = `$${unassignedSavings.toFixed(2)}`;

  if (savingsGoals.length === 0) {
    savingsGoalsList.innerHTML = `
      <div class="empty-message">
        No savings goals yet. Add one, then assign savings transactions to it.
      </div>
    `;
    return;
  }

  savingsGoals.forEach(function (goal) {
    const savedAmount = getSavingsAmountForGoal(goal.id);
    const percent = Math.min((savedAmount / goal.target) * 100, 100);
    const remaining = Math.max(goal.target - savedAmount, 0);

    let progressClass = "";

    if (percent >= 100) {
      progressClass = "complete";
    } else if (percent >= 75) {
      progressClass = "warning";
    }

    const hasAssignedTransactions = transactions.some(function (transaction) {
      return transaction.type === "savings" && transaction.savingsGoalId === String(goal.id);
    });

    const removeButton = hasAssignedTransactions
      ? `<button class="remove-limit-btn" disabled title="Goal has savings transactions assigned">Locked</button>`
      : `<button class="remove-limit-btn" onclick="removeSavingsGoal(${goal.id})">Remove</button>`;

    const item = document.createElement("div");
    item.classList.add("savings-goal-item");

    item.innerHTML = `
      <div class="savings-goal-main">
        <div class="savings-goal-heading">
          <span class="savings-goal-title">${escapeHTML(goal.name)}</span>
          <span class="savings-goal-percent">${percent.toFixed(1)}%</span>
        </div>

        <span class="savings-goal-meta">
          Saved $${savedAmount.toFixed(2)} of $${goal.target.toFixed(2)} • Remaining $${remaining.toFixed(2)}
        </span>

        <div class="mini-progress">
          <div
            class="mini-progress-fill ${progressClass}"
            style="width: ${percent}%"
          ></div>
        </div>
      </div>

      ${removeButton}
    `;

    savingsGoalsList.appendChild(item);
  });
}

function renderRecurringBills() {
  recurringBillsList.innerHTML = "";

  if (recurringBills.length === 0) {
    recurringBillsList.innerHTML = `
      <div class="empty-message">
        No recurring bills yet. Add rent, car payments, subscriptions, or other fixed bills here.
      </div>
    `;
    return;
  }

  const sortedBills = [...recurringBills].sort(function (a, b) {
    return a.day - b.day || a.details.localeCompare(b.details);
  });

  sortedBills.forEach(function (bill) {
    const item = document.createElement("div");
    item.classList.add("recurring-bill-item");

    item.innerHTML = `
      <div class="recurring-bill-main">
        <span class="recurring-bill-title">${escapeHTML(bill.details)}</span>
        <span class="recurring-bill-meta">
          $${bill.amount.toFixed(2)} • ${escapeHTML(bill.category)} • due every month on day ${bill.day}
        </span>
      </div>

      <button class="remove-limit-btn" onclick="removeRecurringBill(${bill.id})">
        Remove
      </button>
    `;

    recurringBillsList.appendChild(item);
  });
}

function renderFutureBills(selectedMonth) {
  futureBillsList.innerHTML = "";

  const futureBills = getFutureBills(selectedMonth);

  if (futureBills.length === 0) {
    futureBillsList.innerHTML = `
      <div class="empty-message">
        No future dated bills found after ${formatMonth(selectedMonth)}.
      </div>
    `;
    return;
  }

  futureBills.slice(0, 16).forEach(function (bill) {
    const item = document.createElement("div");
    item.classList.add("future-bill-item");

    item.innerHTML = `
      <div>
        <span class="future-bill-title">${escapeHTML(bill.details || bill.category)}</span>
        <span class="future-bill-meta">${formatDate(bill.date)} • ${escapeHTML(bill.category)}${bill.recurring ? " • recurring" : ""}</span>
      </div>
      <strong>$${bill.amount.toFixed(2)}</strong>
    `;

    futureBillsList.appendChild(item);
  });
}

function renderMonthlyBreakdown() {
  monthlyBreakdownList.innerHTML = "";

  const months = getBreakdownMonths();

  if (months.length === 0) {
    monthlyBreakdownList.innerHTML = `
      <div class="empty-message">
        Add transactions or recurring bills to see monthly/yearly breakdowns.
      </div>
    `;
    return;
  }

  const years = {};
  months.forEach(function (month) {
    const year = month.slice(0, 4);
    if (!years[year]) {
      years[year] = [];
    }
    years[year].push(month);
  });

  Object.keys(years).sort().reverse().forEach(function (year) {
    const yearSection = document.createElement("div");
    yearSection.classList.add("year-breakdown");

    const yearMonths = years[year].sort().reverse();
    const yearTotals = yearMonths.reduce(function (totals, month) {
      const monthTotals = calculateTotals(getMonthlyTransactions(month));
      totals.income += monthTotals.income;
      totals.expenses += monthTotals.expenses;
      totals.savings += monthTotals.savings;
      return totals;
    }, { income: 0, expenses: 0, savings: 0 });

    const yearSpendable = yearTotals.income - yearTotals.expenses - yearTotals.savings;

    yearSection.innerHTML = `
      <h3>${year}</h3>
      <p class="year-total">
        Income $${yearTotals.income.toFixed(2)} • Expenses $${yearTotals.expenses.toFixed(2)} • Savings $${yearTotals.savings.toFixed(2)} • Spendable $${yearSpendable.toFixed(2)}
      </p>
      <div class="month-breakdown-cards"></div>
    `;

    const cards = yearSection.querySelector(".month-breakdown-cards");

    yearMonths.forEach(function (month) {
      const totals = calculateTotals(getMonthlyTransactions(month));
      const card = document.createElement("button");
      card.type = "button";
      card.classList.add("month-breakdown-card");
      card.onclick = function () {
        overviewMonthInput.value = month;
        filterMonthInput.value = month;
        updateDisplay();
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      };

      card.innerHTML = `
        <span>${formatMonth(month)}</span>
        <strong>$${totals.spendable.toFixed(2)}</strong>
        <small>In $${totals.income.toFixed(2)} • Out $${(totals.expenses + totals.savings).toFixed(2)}</small>
      `;

      cards.appendChild(card);
    });

    monthlyBreakdownList.appendChild(yearSection);
  });
}

function renderInsights(monthlyTransactions) {
  insightsList.innerHTML = "";

  const insights = buildInsights(monthlyTransactions);

  insights.forEach(function (insight) {
    const item = document.createElement("li");
    item.classList.add("insight");
    item.classList.add(insight.type);
    item.textContent = insight.message;

    insightsList.appendChild(item);
  });
}

function buildInsights(monthlyTransactions) {
  const selectedMonth = overviewMonthInput.value || getCurrentMonth();
  const insights = [];
  const totals = calculateTotals(monthlyTransactions);
  const spendingByCategory = {};

  monthlyTransactions.forEach(function (transaction) {
    if (transaction.type === "expense") {
      if (!spendingByCategory[transaction.category]) {
        spendingByCategory[transaction.category] = 0;
      }

      spendingByCategory[transaction.category] += transaction.amount;
    }
  });

  if (monthlyTransactions.length === 0) {
    return [
      {
        type: "info",
        message: `No income, expenses, savings, or recurring bills visible for ${formatMonth(selectedMonth)}.`
      }
    ];
  }

  if (totals.income > 0) {
    const savingsRate = (totals.savings / totals.income) * 100;

    if (totals.spendable < 0) {
      insights.push({
        type: "alert",
        message: `Spendable for ${formatMonth(selectedMonth)} is negative by $${Math.abs(totals.spendable).toFixed(2)}.`
      });
    } else if (savingsRate >= 20) {
      insights.push({
        type: "success",
        message: `Savings rate is ${savingsRate.toFixed(1)}% for ${formatMonth(selectedMonth)}. Future-you may actually stop sending angry emails.`
      });
    } else if (savingsRate > 0) {
      insights.push({
        type: "warn",
        message: `Savings rate is ${savingsRate.toFixed(1)}% for ${formatMonth(selectedMonth)}. Progress exists.`
      });
    } else {
      insights.push({
        type: "warn",
        message: `No savings logged for ${formatMonth(selectedMonth)}.`
      });
    }
  }

  const topCategory = getTopSpendingCategory(spendingByCategory);

  if (topCategory) {
    insights.push({
      type: "info",
      message: `Highest spending category is ${topCategory.category} at $${topCategory.amount.toFixed(2)}.`
    });
  }

  Object.keys(categoryLimits).forEach(function (category) {
    const limit = categoryLimits[category];
    const spent = spendingByCategory[category] || 0;
    const percent = (spent / limit) * 100;

    if (percent >= 100) {
      insights.push({
        type: "alert",
        message: `${category} is over limit: $${spent.toFixed(2)} / $${limit.toFixed(2)}.`
      });
    } else if (percent >= 80) {
      insights.push({
        type: "warn",
        message: `${category} is at ${percent.toFixed(1)}% of its budget limit.`
      });
    }
  });

  const recurringTotal = getRecurringTransactionsForMonth(selectedMonth).reduce(function (total, bill) {
    return total + bill.amount;
  }, 0);

  if (recurringTotal > 0) {
    insights.push({
      type: "info",
      message: `Recurring bills planned for ${formatMonth(selectedMonth)} total $${recurringTotal.toFixed(2)}.`
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      message: "Data logged. No major warnings right now."
    });
  }

  return insights;
}

function getMonthlyTransactions(month) {
  const actual = transactions.filter(function (transaction) {
    return transaction.date && transaction.date.slice(0, 7) === month;
  });

  return actual.concat(getRecurringTransactionsForMonth(month));
}

function getRecurringTransactionsForMonth(month) {
  return recurringBills.map(function (bill) {
    return {
      id: `recurring-${bill.id}-${month}`,
      details: bill.details,
      amount: bill.amount,
      type: "expense",
      category: bill.category,
      savingsGoalId: "",
      date: buildBillDate(month, bill.day),
      recurring: true,
      recurringBillId: bill.id
    };
  });
}

function getFutureBills(selectedMonth) {
  const actualFuture = transactions.filter(function (transaction) {
    return transaction.type === "expense" && transaction.date.slice(0, 7) > selectedMonth;
  });

  const futureRecurring = [];
  const startDate = monthToDate(selectedMonth);

  for (let index = 1; index <= 3; index += 1) {
    const month = dateToMonth(addMonths(startDate, index));
    futureRecurring.push(...getRecurringTransactionsForMonth(month));
  }

  return actualFuture
    .concat(futureRecurring)
    .sort(function (a, b) {
      return new Date(a.date) - new Date(b.date);
    });
}

function getBreakdownMonths() {
  const months = new Set();

  transactions.forEach(function (transaction) {
    if (transaction.date) {
      months.add(transaction.date.slice(0, 7));
    }
  });

  if (recurringBills.length > 0) {
    const currentMonth = getCurrentMonth();
    const overviewMonth = overviewMonthInput.value || currentMonth;

    months.add(currentMonth);
    months.add(overviewMonth);

    let cursor = addMonths(monthToDate(currentMonth), -12);
    const end = addMonths(monthToDate(currentMonth), 12);

    while (cursor <= end) {
      months.add(dateToMonth(cursor));
      cursor = addMonths(cursor, 1);
    }
  }

  return Array.from(months);
}

function getTopSpendingCategory(spendingByCategory) {
  let topCategory = null;
  let topAmount = 0;

  Object.keys(spendingByCategory).forEach(function (category) {
    if (spendingByCategory[category] > topAmount) {
      topCategory = category;
      topAmount = spendingByCategory[category];
    }
  });

  if (!topCategory) {
    return null;
  }

  return {
    category: topCategory,
    amount: topAmount
  };
}

function getCategorySpendingForMonth(category, month) {
  return getMonthlyTransactions(month).reduce(function (total, transaction) {
    if (transaction.type === "expense" && transaction.category === category) {
      return total + transaction.amount;
    }

    return total;
  }, 0);
}

function getTotalSavingsBank() {
  return transactions.reduce(function (total, transaction) {
    if (transaction.type === "savings") {
      return total + transaction.amount;
    }

    return total;
  }, 0);
}

function getAllocatedSavingsTotal() {
  return savingsGoals.reduce(function (total, goal) {
    return total + getSavingsAmountForGoal(goal.id);
  }, 0);
}

function getSavingsAmountForGoal(goalId) {
  return transactions.reduce(function (total, transaction) {
    if (transaction.type === "savings" && transaction.savingsGoalId === String(goalId)) {
      return total + transaction.amount;
    }

    return total;
  }, 0);
}

function getSavingsGoalName(goalId) {
  if (!goalId) {
    return "";
  }

  const goal = savingsGoals.find(function (item) {
    return String(item.id) === String(goalId);
  });

  return goal ? goal.name : "";
}

function populateCategorySelects() {
  categoryInput.innerHTML = "";
  limitCategoryInput.innerHTML = "";
  recurringCategoryInput.innerHTML = "";
  filterCategoryInput.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach(function (category) {
    const optionOne = document.createElement("option");
    optionOne.value = category;
    optionOne.textContent = category;
    categoryInput.appendChild(optionOne);

    if (category !== "Salary" && category !== "Freelance") {
      const optionTwo = document.createElement("option");
      optionTwo.value = category;
      optionTwo.textContent = category;
      limitCategoryInput.appendChild(optionTwo);

      const optionRecurring = document.createElement("option");
      optionRecurring.value = category;
      optionRecurring.textContent = category;
      recurringCategoryInput.appendChild(optionRecurring);
    }

    const optionThree = document.createElement("option");
    optionThree.value = category;
    optionThree.textContent = category;
    filterCategoryInput.appendChild(optionThree);
  });

  const savingsFilterOption = document.createElement("option");
  savingsFilterOption.value = "Savings";
  savingsFilterOption.textContent = "Savings";
  filterCategoryInput.appendChild(savingsFilterOption);
}

function populateSavingsGoalSelect() {
  savingsGoalSelect.innerHTML = `<option value="">Unassigned Savings</option>`;

  savingsGoals.forEach(function (goal) {
    const option = document.createElement("option");
    option.value = String(goal.id);
    option.textContent = goal.name;
    savingsGoalSelect.appendChild(option);
  });
}

function updateTransactionFormMode() {
  if (typeInput.value === "savings") {
    categoryInput.classList.add("hidden");
    savingsGoalSelect.classList.remove("hidden");
  } else {
    categoryInput.classList.remove("hidden");
    savingsGoalSelect.classList.add("hidden");
    savingsGoalSelect.value = "";
  }
}

function editTransaction(id) {
  const transactionToEdit = transactions.find(function (transaction) {
    return transaction.id === id;
  });

  if (!transactionToEdit) {
    return;
  }

  editingTransactionId = id;

  detailsInput.value = transactionToEdit.details || "";
  amountInput.value = transactionToEdit.amount;
  typeInput.value = transactionToEdit.type;
  categoryInput.value = transactionToEdit.type === "savings" ? "Other" : transactionToEdit.category;
  savingsGoalSelect.value = transactionToEdit.savingsGoalId || "";
  dateInput.value = transactionToEdit.date;

  updateTransactionFormMode();

  formTitle.textContent = "Edit Transaction";
  submitButton.textContent = "Save Changes";
  cancelEditButton.classList.remove("hidden");

  window.scrollTo({
    top: transactionForm.offsetTop - 40,
    behavior: "smooth"
  });
}

function deleteTransaction(id) {
  transactions = transactions.filter(function (transaction) {
    return transaction.id !== id;
  });

  saveToLocalStorage();
  updateDisplay();
}

function removeCategoryLimit(category) {
  delete categoryLimits[category];

  saveToLocalStorage();
  updateDisplay();
}

function removeSavingsGoal(goalId) {
  const hasAssignedTransactions = transactions.some(function (transaction) {
    return transaction.type === "savings" && transaction.savingsGoalId === String(goalId);
  });

  if (hasAssignedTransactions) {
    alert("This savings goal has transactions assigned to it and cannot be removed.");
    return;
  }

  savingsGoals = savingsGoals.filter(function (goal) {
    return goal.id !== goalId;
  });

  populateSavingsGoalSelect();
  saveToLocalStorage();
  updateDisplay();
}

function removeRecurringBill(id) {
  recurringBills = recurringBills.filter(function (bill) {
    return bill.id !== id;
  });

  saveToLocalStorage();
  updateDisplay();
}

function scrollToRecurringBills() {
  recurringBillForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function resetForm() {
  transactionForm.reset();
  editingTransactionId = null;
  dateInput.value = "";

  formTitle.textContent = "Add Transaction";
  submitButton.textContent = "Add Transaction";
  cancelEditButton.classList.add("hidden");

  updateTransactionFormMode();
}

function resetFilters() {
  searchInput.value = "";
  filterTypeInput.value = "all";
  filterCategoryInput.value = "all";
  filterMonthInput.value = "";
  sortTransactionsInput.value = "newest";
}

function clearAllData() {
  transactions = [];
  categoryLimits = {};
  savingsGoals = [];
  recurringBills = [];
  editingTransactionId = null;

  localStorage.removeItem("budgetTrackerGoal");
  localStorage.removeItem("budgetTrackerCategories");
  localStorage.removeItem("budgetTrackerDarkMode");

  snarkMessageElement.textContent = "Fresh start. Try not to financially freestyle immediately.";

  populateCategorySelects();
  populateSavingsGoalSelect();
  saveToLocalStorage();
  resetForm();
  resetFilters();
  updateDisplay();
}

function saveToLocalStorage() {
  localStorage.setItem("budgetTrackerTransactions", JSON.stringify(transactions));
  localStorage.setItem("budgetTrackerCategoryLimits", JSON.stringify(categoryLimits));
  localStorage.setItem("budgetTrackerSavingsGoals", JSON.stringify(savingsGoals));
  localStorage.setItem("budgetTrackerRecurringBills", JSON.stringify(recurringBills));
}

function loadFromLocalStorage() {
  const savedTransactions = localStorage.getItem("budgetTrackerTransactions");
  const savedCategoryLimits = localStorage.getItem("budgetTrackerCategoryLimits");
  const savedSavingsGoals = localStorage.getItem("budgetTrackerSavingsGoals");
  const savedRecurringBills = localStorage.getItem("budgetTrackerRecurringBills");

  if (savedTransactions) {
    const parsedTransactions = JSON.parse(savedTransactions);

    transactions = parsedTransactions.map(function (transaction) {
      const oldDescription = transaction.description || "";
      const oldNotes = transaction.notes || "";
      const existingDetails = transaction.details || "";

      let migratedDetails = existingDetails;

      if (!migratedDetails && oldDescription && oldNotes) {
        migratedDetails = `${oldDescription} - ${oldNotes}`;
      } else if (!migratedDetails && oldDescription) {
        migratedDetails = oldDescription;
      } else if (!migratedDetails && oldNotes) {
        migratedDetails = oldNotes;
      }

      return {
        id: transaction.id,
        details: migratedDetails,
        amount: Number(transaction.amount),
        type: transaction.type || "expense",
        category: transaction.category || "Other",
        savingsGoalId: transaction.savingsGoalId || "",
        date: transaction.date || getCurrentDate()
      };
    });
  }

  if (savedCategoryLimits) {
    categoryLimits = JSON.parse(savedCategoryLimits);
  }

  if (savedSavingsGoals) {
    savingsGoals = JSON.parse(savedSavingsGoals);
  }

  if (savedRecurringBills) {
    recurringBills = JSON.parse(savedRecurringBills).map(function (bill) {
      return {
        id: bill.id,
        details: bill.details || "Recurring Bill",
        amount: Number(bill.amount),
        category: bill.category || "Bills",
        day: Number(bill.day) || 1
      };
    });
  }
}

function exportTransactionsToCSV() {
  if (transactions.length === 0) {
    alert("No transactions to export.");
    return;
  }

  const headers = ["Details", "Amount", "Type", "Category", "Savings Goal", "Date"];

  const rows = transactions.map(function (transaction) {
    return [
      transaction.details,
      transaction.amount,
      transaction.type,
      transaction.category,
      getSavingsGoalName(transaction.savingsGoalId),
      transaction.date
    ];
  });

  const csvContent = [headers].concat(rows)
    .map(function (row) {
      return row.map(escapeCSVValue).join(",");
    })
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = url;
  downloadLink.download = "bread-tracker-transactions.csv";
  downloadLink.click();

  URL.revokeObjectURL(url);
}

function drawCategoryChart(monthlyTransactions) {
  const expensesByCategory = {};

  monthlyTransactions.forEach(function (transaction) {
    if (transaction.type === "expense") {
      if (!expensesByCategory[transaction.category]) {
        expensesByCategory[transaction.category] = 0;
      }

      expensesByCategory[transaction.category] += transaction.amount;
    }
  });

  const chartCategories = Object.keys(expensesByCategory);
  const amounts = Object.values(expensesByCategory);

  chartContext.clearRect(0, 0, categoryChart.width, categoryChart.height);

  chartContext.fillStyle = "#f8fbff";
  chartContext.font = "16px monospace";

  if (chartCategories.length === 0) {
    chartContext.fillText("No expense data to chart yet.", 24, 50);
    return;
  }

  const chartPadding = 35;
  const barGap = 12;
  const availableWidth = categoryChart.width - chartPadding * 2;
  const availableHeight = categoryChart.height - chartPadding * 2;
  const barWidth = Math.max(16, availableWidth / chartCategories.length - barGap);
  const maxAmount = Math.max(...amounts);

  const colors = [
    "#00ff9c",
    "#ff2f68",
    "#ffd84d",
    "#40b7ff",
    "#bc6cff",
    "#00e7ff",
    "#ff8a1f",
    "#f8fbff"
  ];

  chartCategories.forEach(function (category, index) {
    const amount = expensesByCategory[category];
    const barHeight = (amount / maxAmount) * availableHeight;
    const x = chartPadding + index * (barWidth + barGap);
    const y = categoryChart.height - chartPadding - barHeight;

    chartContext.fillStyle = colors[index % colors.length];
    chartContext.fillRect(x, y, barWidth, barHeight);

    chartContext.fillStyle = "#f8fbff";
    chartContext.font = "12px monospace";

    const shortCategory = category.length > 8 ? category.slice(0, 8) + "..." : category;

    chartContext.fillText(shortCategory, x, categoryChart.height - 12);
    chartContext.fillText(`$${amount.toFixed(0)}`, x, y - 8);
  });
}

function generateSnark(amount, category, details) {
  const purchaseLabel = details || category;

  const messages = [
    `Ah yes, $${amount.toFixed(2)} on ${purchaseLabel}. The economy thanks you.`,
    `Another ${category} expense. Bold strategy.`,
    `$${amount.toFixed(2)} gone. It had a short but meaningful life.`,
    `Transaction logged. Your wallet felt that.`,
    `Spending detected. Pretending this was necessary...`,
    `Somewhere, a spreadsheet just sighed.`
  ];

  snarkMessageElement.textContent = messages[Math.floor(Math.random() * messages.length)];
}

function generateSavingsMessage(amount, savingsGoalId) {
  const goalName = getSavingsGoalName(savingsGoalId);
  const targetText = goalName ? ` toward ${goalName}` : "";

  snarkMessageElement.textContent =
    `$${amount.toFixed(2)} saved${targetText}. Suspiciously responsible behavior detected.`;
}

function getCurrentDate() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

function getCurrentMonth() {
  return getCurrentDate().slice(0, 7);
}

function buildBillDate(month, day) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const safeDay = Math.min(day, lastDay);

  return `${month}-${String(safeDay).padStart(2, "0")}`;
}

function daysInMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

function monthToDate(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1);
}

function dateToMonth(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0")
  ].join("-");
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value).replaceAll("`", "&#096;");
}

function escapeCSVValue(value) {
  const stringValue = String(value ?? "");

  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}
