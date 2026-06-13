<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// API base URL
const API_URL = '/api'

// State
const expenses = ref([])
const isOnline = ref(false)
const title = ref('')
const amount = ref('')
const category = ref('')
const searchQuery = ref('')
const selectedCategoryFilter = ref('')
const toasts = ref([])
let statusInterval = null

// Category icons and labels
const categories = [
  { value: 'food', label: 'Food', icon: '🍔' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'utilities', label: 'Utilities', icon: '💡' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'other', label: 'Other', icon: '📦' }
]

const getCategoryIcon = (cat) => {
  const c = categories.find(item => item.value === cat.toLowerCase())
  return c ? c.icon : '💰'
}

const getCategoryClass = (cat) => {
  const valid = ['food', 'travel', 'utilities', 'entertainment', 'other']
  const cleanCat = cat.toLowerCase()
  return valid.includes(cleanCat) ? `cat-${cleanCat}` : 'cat-other'
}

// Check Backend Connection Status
const checkBackendStatus = async () => {
  try {
    await $fetch(`${API_URL}/`)
    isOnline.value = true
  } catch (err) {
    isOnline.value = false
  }
}

// Fetch Expenses
const fetchExpenses = async () => {
  try {
    const data = await $fetch(`${API_URL}/expenses`)
    expenses.value = data
  } catch (err) {
    console.error('Failed to fetch expenses:', err)
    showToast('Failed to connect to the backend server', 'error')
  }
}

// Add Expense
const handleAddExpense = async () => {
  const numericAmount = parseFloat(amount.value)
  if (!title.value.trim()) {
    showToast('Please enter an expense title', 'error')
    return
  }
  if (isNaN(numericAmount) || numericAmount <= 0) {
    showToast('Please enter a valid amount greater than 0', 'error')
    return
  }
  if (!category.value) {
    showToast('Please select a category', 'error')
    return
  }

  try {
    const newExpense = {
      title: title.value.trim(),
      amount: numericAmount,
      category: category.value
    }
    
    await $fetch(`${API_URL}/expenses`, {
      method: 'POST',
      body: newExpense
    })
    
    // Reset form
    title.value = ''
    amount.value = ''
    category.value = ''
    
    showToast('Expense tracker updated: Added expense!', 'success')
    await fetchExpenses()
  } catch (err) {
    showToast('Could not save expense', 'error')
  }
}

// Delete Expense
const handleDeleteExpense = async (id) => {
  try {
    await $fetch(`${API_URL}/expenses/${id}`, {
      method: 'DELETE'
    })
    showToast('Expense removed', 'success')
    await fetchExpenses()
  } catch (err) {
    showToast('Could not remove expense', 'error')
  }
}

// Computed: Total Expenses
const totalExpenses = computed(() => {
  return expenses.value.reduce((sum, item) => sum + item.amount, 0)
})

// Computed: Filtered Expenses
const filteredExpenses = computed(() => {
  return expenses.value.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCat = !selectedCategoryFilter.value || item.category.toLowerCase() === selectedCategoryFilter.value.toLowerCase()
    return matchSearch && matchCat
  }).reverse() // Show newest first
})

// Computed: Category Totals & Percentages
const categoryBreakdown = computed(() => {
  const totals = { food: 0, travel: 0, utilities: 0, entertainment: 0, other: 0 }
  let overallTotal = 0

  expenses.value.forEach(item => {
    const cat = item.category.toLowerCase()
    const amt = parseFloat(item.amount) || 0
    if (totals[cat] !== undefined) {
      totals[cat] += amt
    } else {
      totals['other'] += amt
    }
    overallTotal += amt
  })

  return categories.map(c => {
    const amount = totals[c.value] || 0
    const percent = overallTotal > 0 ? (amount / overallTotal) * 100 : 0
    return {
      name: c.label,
      value: c.value,
      amount,
      percent: percent.toFixed(0)
    }
  })
})

// Toast helper
const showToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

onMounted(() => {
  checkBackendStatus()
  fetchExpenses()
  statusInterval = setInterval(checkBackendStatus, 5000)
})

onUnmounted(() => {
  if (statusInterval) clearInterval(statusInterval)
})
</script>

<template>
  <div class="app-container">
    <!-- Header Section -->
    <header class="app-header">
      <div class="logo-container">
        <div class="logo-icon" aria-hidden="true">💵</div>
        <div class="logo-text">
          <h1 id="app-title">Expense Tracker</h1>
        </div>
      </div>
    </header>

    <!-- Main Dashboard Grid -->
    <main class="dashboard-grid">
      
      <!-- Left Column: Controls and Stats -->
      <aside class="sidebar-stack">
        <!-- Summary Stats Card -->
        <section class="glass-card" aria-labelledby="summary-title">
          <h2 class="card-title" id="summary-title">
            <span class="card-title-icon" aria-hidden="true">📈</span> Financial Summary
          </h2>
          <div class="stats-summary">
            <div class="stat-item">
              <span class="stat-label">Total Outflow</span>
              <span class="stat-value" id="total-outflow">₹{{ totalExpenses.toFixed(2) }}</span>
            </div>
            <div class="stat-item" style="margin-top: 0.5rem;">
              <span class="stat-label">Transactions</span>
              <span class="stat-value" id="total-count" style="font-size: 1.5rem; color: var(--text-secondary)">
                {{ expenses.length }} records
              </span>
            </div>
          </div>
        </section>

        <!-- Add Expense Form Card -->
        <section class="glass-card" aria-labelledby="add-expense-title">
          <h2 class="card-title" id="add-expense-title">
            <span class="card-title-icon" aria-hidden="true">➕</span> Log Expense
          </h2>
          <form @submit.prevent="handleAddExpense" novalidate>
            <div class="form-group">
              <label for="expense-title-input" class="form-label">Expense Title</label>
              <input 
                type="text" 
                id="expense-title-input" 
                v-model="title" 
                class="form-control" 
                placeholder="e.g. Weekly Grocery Run" 
                required
              />
            </div>
            
            <div class="form-group">
              <label for="expense-amount-input" class="form-label">Amount (₹ INR)</label>
              <input 
                type="number" 
                id="expense-amount-input" 
                v-model="amount" 
                class="form-control" 
                placeholder="0.00" 
                step="0.01" 
                min="0.01" 
                required
              />
            </div>
            
            <div class="form-group">
              <label for="expense-category-select" class="form-label">Category</label>
              <select 
                id="expense-category-select" 
                v-model="category" 
                class="form-control" 
                required
              >
                <option value="" disabled selected>Select category...</option>
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                  {{ cat.icon }} {{ cat.label }}
                </option>
              </select>
            </div>
            
            <button 
              type="submit" 
              id="add-expense-submit-btn" 
              class="btn btn-primary btn-block"
              style="margin-top: 0.5rem;"
            >
              Add Expense
            </button>
          </form>
        </section>
      </aside>

      <!-- Right Column: Graphs & Transaction Details -->
      <div class="sidebar-stack">
        <!-- Visual Category Distribution -->
        <section class="glass-card" aria-labelledby="category-breakdown-title">
          <h2 class="card-title" id="category-breakdown-title">
            <span class="card-title-icon" aria-hidden="true">📊</span> Category Distribution
          </h2>
          <div class="visualization-container" id="category-bars-list">
            <div v-for="bar in categoryBreakdown" :key="bar.value" class="bar-row">
              <div class="bar-info">
                <span class="bar-name">{{ getCategoryIcon(bar.value) }} {{ bar.name }}</span>
                <span class="bar-percent">₹{{ bar.amount.toFixed(2) }} ({{ bar.percent }}%)</span>
              </div>
              <div class="bar-track">
                <div 
                  class="bar-fill" 
                  :class="getCategoryClass(bar.value)" 
                  :style="{ width: `${bar.percent}%` }"
                ></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Transaction Records History -->
        <section class="glass-card" aria-labelledby="records-title" style="flex: 1;">
          <h2 class="card-title" id="records-title">
            <span class="card-title-icon" aria-hidden="true">🧾</span> Transaction Ledger
          </h2>
          
          <!-- Filter & Search Controls -->
          <div class="filter-bar">
            <input 
              type="text" 
              id="search-query-input" 
              v-model="searchQuery" 
              class="form-control search-input" 
              placeholder="🔍 Search transactions..."
            />
            <select 
              id="category-filter-select" 
              v-model="selectedCategoryFilter" 
              class="form-control filter-select"
            >
              <option value="">All Categories</option>
              <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <!-- List of records -->
          <div class="expense-list-container" id="ledger-records-container">
            <div v-if="filteredExpenses.length > 0" style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div 
                v-for="expense in filteredExpenses" 
                :key="expense.id" 
                class="expense-item"
              >
                <div class="expense-info">
                  <div :class="['category-icon', getCategoryClass(expense.category)]" aria-hidden="true">
                    {{ getCategoryIcon(expense.category) }}
                  </div>
                  <div class="expense-details">
                    <span class="expense-title">{{ expense.title }}</span>
                    <div class="expense-meta">
                      <span class="expense-category">{{ expense.category }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="expense-action">
                  <span class="expense-amount">₹{{ expense.amount.toFixed(2) }}</span>
                  <button 
                    @click="handleDeleteExpense(expense.id)" 
                    :id="`delete-btn-${expense.id}`" 
                    class="btn btn-danger" 
                    title="Delete Expense"
                    aria-label="Delete expense"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Empty State -->
            <div v-else class="empty-state" id="empty-ledger-view">
              <span class="empty-icon" aria-hidden="true">📥</span>
              <p class="empty-text">
                {{ searchQuery || selectedCategoryFilter ? 'No transactions match your search query.' : 'No transactions recorded yet. Log your first expense on the left panel!' }}
              </p>
            </div>
          </div>
        </section>
      </div>

    </main>

    <!-- Custom Toasts -->
    <div class="toast-container" id="toast-messages-container" aria-live="polite">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        :class="['toast', toast.type === 'error' ? 'toast-error' : 'toast-success']"
      >
        <span class="toast-icon" aria-hidden="true">
          {{ toast.type === 'error' ? '⚠️' : '✨' }}
        </span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>
