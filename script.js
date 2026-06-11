const transactionForm = document.getElementById("transaction-form");
const detailsInput = document.getElementById("details");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const savingsGoalSelect = document.getElementById("savings-goal-select");
const dateInput = document.getElementById("date");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expensesElement = document.getElementById("expenses");
const savingsBankElement = document.getElementById("savings-bank");
const transactionList = document.getElementById("transaction-list");
const emptyMessage = document.getElementById("empty-message");

const budgetGoalInput = document.getElementById("budget-goal");
const setGoalButton = document.getElementById("set-goal-btn");
const goalStatusElement = document.getElementById("goal-status");
const budgetSuggestionElement = document.getElementById("budget-suggestion");
const goalProgressElement = document.getElementById("goal-progress");

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

const insightsList = document.getElementById("insights-list");

const reportMonthElement = document.getElementById("report-month");
const reportIncomeElement = document.getElementById("report-income");
const reportExpensesElement = document.getElementById("report-expenses");
const reportSavingsElement = document.getElementById("report-savings");
const reportNetElement = document.getElementById("report-net");
const reportTopCategoryElement = document.getElementById("report-top-category");

const snarkMessageElement = document.getElementById("snark-message");

const categories = [
  "Salary",
  "Freelance",
  "Food",
  "Rent",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other"
];

let transactions = [];
let categoryLimits = {};
let savingsGoals = [];
let budgetGoal = 0;
let editingTransactionId = null;

loadFromLocalStorage();
populateCategorySelects();
populateSavingsGoalSelect();
setDefaultDate();
updateTransactionFormMode();
updateDisplay();

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

typeInput.addEventListener("change", function () {
  updateTransactionFormMode();
});

setGoalButton.addEventListener("click", function () {
  const goalValue = Number(budgetGoalInput.value);

  if (goalValue <= 0) {
    goalStatusElement.textContent = "Please enter a spending cap greater than $0.";
    return;
  }

  budgetGoal = goalValue;
  budgetGoalInput.value = "";

  saveToLocalStorage();
  updateDisplay();
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

searchInput.addEventListener("input", updateDisplay);
filterTypeInput.addEventListener("change", updateDisplay);
filterCategoryInput.addEventListener("change", updateDisplay);
filterMonthInput.addEventListener("change", updateDisplay);
sortTransactionsInput.addEventListener("change", updateDisplay);

resetFiltersButton.addEventListener("click", function () {
  resetFilters();
  updateDisplay();
});

cancelEditButton.addEventListener("click", function () {
  resetForm();
});

exportCsvButton.addEventListener("click", function () {
  exportTransactionsToCSV();
});

clearAllButton.addEventListener("click", function () {
  const confirmed = confirm("Are you sure you want to delete all transactions, limits, goals, and savings goals?");

  if (!confirmed) {
    return;
  }

  clearAllData();
});

function addNewTransaction(details, amount, type, category, savingsGoalId, date) {
  const transaction = {
    id: Date.now(),
    details: details,
    amount: amount,
    type: type,
    category: category,
    savingsGoalId: savingsGoalId,
    date: date
  };

  transactions.push(transaction);
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
  const filteredTransactions = getFilteredTransactions();
  const sortedTransactions = sortTransactions(filteredTransactions);

  renderTransactions(sortedTransactions);
  updateSummary(sortedTransactions);
  updateBudgetGoal(sortedTransactions);
  drawCategoryChart(sortedTransactions);
  renderCategoryLimits();
  renderSavingsGoals();
  renderInsights(sortedTransactions);
  renderMonthlyReport();
}

function getFilteredTransactions() {
  const searchText = searchInput.value.toLowerCase();
  const selectedType = filterTypeInput.value;
  const selectedCategory = filterCategoryInput.value;
  const selectedMonth = filterMonthInput.value;

  return transactions.filter(function (transaction) {
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

    const amountSign = transaction.type === "income" ? "+" : "-";
    const formattedDate = formatDate(transaction.date);
    const details = transaction.details || "";
    const typeLabel = transaction.type.toUpperCase();

    let title = transaction.category;

    if (transaction.type === "savings") {
      const goalName = getSavingsGoalName(transaction.savingsGoalId);
      title = goalName ? `Savings → ${goalName}` : "Savings → Unassigned";
    }

    const detailsHTML = details
      ? `<span class="transaction-details">${escapeHTML(details)}</span>`
      : `<span class="transaction-details muted">No details entered.</span>`;

    listItem.innerHTML = `
      <div class="transaction-main">
        <span class="transaction-title">${escapeHTML(title)}</span>
        <span class="transaction-meta">${typeLabel} • ${formattedDate}</span>
        ${detailsHTML}
        <span class="transaction-amount">${amountSign}$${transaction.amount.toFixed(2)}</span>
      </div>

      <div class="transaction-actions">
        <button class="edit-btn" onclick="editTransaction(${transaction.id})">
          Edit
        </button>

        <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">
          Delete
        </button>
      </div>
    `;

    transactionList.appendChild(listItem);
  });
}

function updateSummary(filteredTransactions) {
  const totals = calculateTotals(filteredTransactions);

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

function updateBudgetGoal(filteredTransactions) {
  const totals = calculateTotals(filteredTransactions);

  if (budgetGoal <= 0) {
    goalStatusElement.textContent = "Set a spending cap to get feedback.";
    budgetSuggestionElement.textContent = "Add income, expenses, and savings to see feedback.";
    goalProgressElement.style.width = "0%";
    goalProgressElement.classList.remove("warning");
    return;
  }

  const remainingGoal = budgetGoal - totals.expenses;
  const spendingPercent = (totals.expenses / budgetGoal) * 100;
  const progressWidth = Math.min(spendingPercent, 100);

  goalProgressElement.style.width = `${progressWidth}%`;

  if (totals.expenses > budgetGoal) {
    goalStatusElement.textContent =
      `Cap: $${budgetGoal.toFixed(2)}. You're over by $${Math.abs(remainingGoal).toFixed(2)}.`;

    goalProgressElement.classList.add("warning");
  } else {
    goalStatusElement.textContent =
      `Cap: $${budgetGoal.toFixed(2)}. You're under by $${remainingGoal.toFixed(2)}.`;

    goalProgressElement.classList.remove("warning");
  }

  if (totals.income <= 0) {
    budgetSuggestionElement.textContent = "Add income so I can compare spending and saving against cash flow.";
    return;
  }

  const spendingRate = (totals.expenses / totals.income) * 100;
  const savingsRate = (totals.savings / totals.income) * 100;

  let habitMessage = "";

  if (totals.spendable < 0) {
    habitMessage = "Spendable balance is negative. Your money is doing parkour off a cliff.";
  } else if (savingsRate >= 20 && spendingRate <= 70) {
    habitMessage = "Strong setup. You are saving without torching your spendable cash.";
  } else if (savingsRate > 0) {
    habitMessage = "Savings are moving. Keep an eye on expenses so the plan stays realistic.";
  } else {
    habitMessage = "No savings logged yet. Future-you is standing in the corner, disappointed but hopeful.";
  }

  budgetSuggestionElement.textContent =
    `Spending rate: ${spendingRate.toFixed(1)}%. Savings rate: ${savingsRate.toFixed(1)}%. ${habitMessage}`;
}

function renderMonthlyReport() {
  const selectedMonth = filterMonthInput.value || getCurrentMonth();

  let income = 0;
  let expenses = 0;
  let savings = 0;
  const spendingByCategory = {};

  transactions.forEach(function (transaction) {
    const transactionMonth = transaction.date.slice(0, 7);

    if (transactionMonth !== selectedMonth) {
      return;
    }

    if (transaction.type === "income") {
      income += transaction.amount;
    } else if (transaction.type === "expense") {
      expenses += transaction.amount;

      if (!spendingByCategory[transaction.category]) {
        spendingByCategory[transaction.category] = 0;
      }

      spendingByCategory[transaction.category] += transaction.amount;
    } else if (transaction.type === "savings") {
      savings += transaction.amount;
    }
  });

  const spendable = income - expenses - savings;
  const topCategory = getTopSpendingCategory(spendingByCategory);

  reportMonthElement.textContent = selectedMonth;
  reportIncomeElement.textContent = `$${income.toFixed(2)}`;
  reportExpensesElement.textContent = `$${expenses.toFixed(2)}`;
  reportSavingsElement.textContent = `$${savings.toFixed(2)}`;
  reportNetElement.textContent = `$${spendable.toFixed(2)}`;
  reportTopCategoryElement.textContent = topCategory ? topCategory.category : "None";
}

function renderCategoryLimits() {
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

  const currentMonth = getCurrentMonth();

  limitCategories.forEach(function (category) {
    const limit = categoryLimits[category];
    const spent = getCategorySpendingForMonth(category, currentMonth);
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
          Spent $${spent.toFixed(2)} of $${limit.toFixed(2)} this month
        </span>

        <div class="mini-progress">
          <div
            class="mini-progress-fill ${progressClass}"
            style="width: ${percent}%"
          ></div>
        </div>
      </div>

      <button class="remove-limit-btn" onclick="removeCategoryLimit('${category}')">
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
          Saved $${savedAmount.toFixed(2)} of $${goal.target.toFixed(2)}.
          Remaining: $${remaining.toFixed(2)}.
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

function renderInsights(filteredTransactions) {
  insightsList.innerHTML = "";

  const insights = buildInsights(filteredTransactions);

  insights.forEach(function (insight) {
    const item = document.createElement("li");
    item.classList.add("insight");
    item.classList.add(insight.type);
    item.textContent = insight.message;

    insightsList.appendChild(item);
  });
}

function buildInsights(filteredTransactions) {
  const insights = [];
  const totals = calculateTotals(filteredTransactions);
  const spendingByCategory = {};

  filteredTransactions.forEach(function (transaction) {
    if (transaction.type === "expense") {
      if (!spendingByCategory[transaction.category]) {
        spendingByCategory[transaction.category] = 0;
      }

      spendingByCategory[transaction.category] += transaction.amount;
    }
  });

  if (filteredTransactions.length === 0) {
    return [
      {
        type: "info",
        message: "No visible transactions. Add data or adjust filters."
      }
    ];
  }

  if (totals.income > 0) {
    const savingsRate = (totals.savings / totals.income) * 100;

    if (totals.spendable < 0) {
      insights.push({
        type: "alert",
        message: `Spendable balance is negative by $${Math.abs(totals.spendable).toFixed(2)}. Savings and spending outran income.`
      });
    } else if (savingsRate >= 20) {
      insights.push({
        type: "success",
        message: `Savings rate is ${savingsRate.toFixed(1)}%. Future-you may actually stop sending angry emails.`
      });
    } else if (savingsRate > 0) {
      insights.push({
        type: "warn",
        message: `Savings rate is ${savingsRate.toFixed(1)}%. Progress exists. It is wearing tiny shoes, but it exists.`
      });
    } else {
      insights.push({
        type: "warn",
        message: "No savings logged in the visible data."
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

  const completedGoals = savingsGoals.filter(function (goal) {
    return getSavingsAmountForGoal(goal.id) >= goal.target;
  });

  if (completedGoals.length > 0) {
    insights.push({
      type: "success",
      message: `${completedGoals.length} savings goal(s) reached. Suspiciously responsible behavior detected.`
    });
  }

  if (budgetGoal > 0 && totals.expenses <= budgetGoal) {
    insights.push({
      type: "success",
      message: `Overall spending is under your monthly cap by $${(budgetGoal - totals.expenses).toFixed(2)}.`
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      message: "Ledger stable. No major warnings detected."
    });
  }

  return insights;
}

function populateCategorySelects() {
  categoryInput.innerHTML = "";
  limitCategoryInput.innerHTML = "";
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
  let total = 0;

  transactions.forEach(function (transaction) {
    const transactionMonth = transaction.date.slice(0, 7);

    if (
      transaction.type === "expense" &&
      transaction.category === category &&
      transactionMonth === month
    ) {
      total += transaction.amount;
    }
  });

  return total;
}

function getTotalSavingsBank() {
  let total = 0;

  transactions.forEach(function (transaction) {
    if (transaction.type === "savings") {
      total += transaction.amount;
    }
  });

  return total;
}

function getAllocatedSavingsTotal() {
  let total = 0;

  transactions.forEach(function (transaction) {
    if (transaction.type === "savings" && transaction.savingsGoalId) {
      total += transaction.amount;
    }
  });

  return total;
}

function getSavingsAmountForGoal(goalId) {
  let total = 0;

  transactions.forEach(function (transaction) {
    if (
      transaction.type === "savings" &&
      transaction.savingsGoalId === String(goalId)
    ) {
      total += transaction.amount;
    }
  });

  return total;
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

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function drawCategoryChart(filteredTransactions) {
  const expensesByCategory = {};

  filteredTransactions.forEach(function (transaction) {
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

  chartContext.fillStyle = "#d7dde5";
  chartContext.font = "16px monospace";

  if (chartCategories.length === 0) {
    chartContext.fillText("No expense data to chart yet.", 24, 50);
    return;
  }

  const chartPadding = 35;
  const barGap = 12;
  const availableWidth = categoryChart.width - chartPadding * 2;
  const availableHeight = categoryChart.height - chartPadding * 2;
  const barWidth = availableWidth / chartCategories.length - barGap;
  const maxAmount = Math.max(...amounts);

  const colors = [
    "#38d996",
    "#ff5c7a",
    "#f3c969",
    "#6bb8ff",
    "#b48cff",
    "#4dd8ff",
    "#f97316",
    "#d7dde5"
  ];

  chartCategories.forEach(function (category, index) {
    const amount = expensesByCategory[category];
    const barHeight = (amount / maxAmount) * availableHeight;
    const x = chartPadding + index * (barWidth + barGap);
    const y = categoryChart.height - chartPadding - barHeight;

    chartContext.fillStyle = colors[index % colors.length];
    chartContext.fillRect(x, y, barWidth, barHeight);

    chartContext.fillStyle = "#d7dde5";
    chartContext.font = "12px monospace";

    const shortCategory = category.length > 8 ? category.slice(0, 8) + "..." : category;

    chartContext.fillText(shortCategory, x, categoryChart.height - 12);
    chartContext.fillText(`$${amount.toFixed(0)}`, x, y - 8);
  });
}

function generateSnark(amount, category, details) {
  const purchaseLabel = details || category;

  const mildSnarks = [
    `Ah yes, $${amount.toFixed(2)} on ${purchaseLabel}. The economy thanks you.`,
    `Another ${category} expense. Bold strategy.`,
    `$${amount.toFixed(2)} gone. It had a short but meaningful life.`,
    `Transaction logged. Your wallet felt that.`,
    `Spending detected. Pretending this was necessary...`
  ];

  const mediumSnarks = [
    `$${amount.toFixed(2)}? On ${purchaseLabel}? Fascinating financial lore.`,
    `Your budget just blinked twice for help.`,
    `That's not a purchase, that's a plot twist.`,
    `Somewhere, a spreadsheet just sighed.`,
    `Expense accepted. Judgment pending. Actually, judgment complete.`
  ];

  const spicySnarks = [
    `$${amount.toFixed(2)}. Incredible. The budget has left the chat.`,
    `That purchase had main character energy and side character consequences.`,
    `Your savings account just filed a complaint.`,
    `A bold donation to capitalism. Respectfully questionable.`,
    `This is why we can't have compound interest.`
  ];

  let snarkPool = mildSnarks;

  if (amount >= 50 && amount < 150) {
    snarkPool = mediumSnarks;
  }

  if (amount >= 150) {
    snarkPool = spicySnarks;
  }

  const randomIndex = Math.floor(Math.random() * snarkPool.length);
  snarkMessageElement.textContent = snarkPool[randomIndex];
}

function generateSavingsMessage(amount, savingsGoalId) {
  const goalName = getSavingsGoalName(savingsGoalId);
  const label = goalName || "the savings void";

  const savingsMessages = [
    `$${amount.toFixed(2)} sent to ${label}. Future-you is mildly less doomed.`,
    `Savings logged. Look at you, betraying chaos.`,
    `$${amount.toFixed(2)} saved. The budget goblin has been denied a snack.`,
    `A responsible transaction? In this economy?`,
    `Savings bank reinforced. Tiny applause from compound interest.`
  ];

  const randomIndex = Math.floor(Math.random() * savingsMessages.length);
  snarkMessageElement.textContent = savingsMessages[randomIndex];
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

function resetForm() {
  transactionForm.reset();
  editingTransactionId = null;

  formTitle.textContent = "Add Transaction";
  submitButton.textContent = "Add Transaction";
  cancelEditButton.classList.add("hidden");

  setDefaultDate();
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
  budgetGoal = 0;
  editingTransactionId = null;

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

function setDefaultDate() {
  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;
}

function saveToLocalStorage() {
  localStorage.setItem("budgetTrackerTransactions", JSON.stringify(transactions));
  localStorage.setItem("budgetTrackerGoal", JSON.stringify(budgetGoal));
  localStorage.setItem("budgetTrackerCategoryLimits", JSON.stringify(categoryLimits));
  localStorage.setItem("budgetTrackerSavingsGoals", JSON.stringify(savingsGoals));
}

function loadFromLocalStorage() {
  const savedTransactions = localStorage.getItem("budgetTrackerTransactions");
  const savedGoal = localStorage.getItem("budgetTrackerGoal");
  const savedCategoryLimits = localStorage.getItem("budgetTrackerCategoryLimits");
  const savedSavingsGoals = localStorage.getItem("budgetTrackerSavingsGoals");

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
        date: transaction.date
      };
    });
  }

  if (savedGoal) {
    budgetGoal = JSON.parse(savedGoal);
  }

  if (savedCategoryLimits) {
    categoryLimits = JSON.parse(savedCategoryLimits);
  }

  if (savedSavingsGoals) {
    savingsGoals = JSON.parse(savedSavingsGoals);
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
      transaction.details || "",
      transaction.amount,
      transaction.type,
      transaction.category,
      getSavingsGoalName(transaction.savingsGoalId),
      transaction.date
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map(function (row) {
      return row.map(escapeCSVValue).join(",");
    })
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv"
  });

  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "budget-transactions.csv";
  downloadLink.click();

  URL.revokeObjectURL(url);
}

function escapeCSVValue(value) {
  const stringValue = String(value);

  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}