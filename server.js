const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Create database connection with proper path
const dbPath = path.join(__dirname, 'data', 'budget.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1); // Exit if database connection fails
    } else {
        console.log('Connected to database at:', dbPath);
        createTables();
    }
});

// Create necessary tables
function createTables() {
    db.serialize(() => {
        // Income table
        db.run(`CREATE TABLE IF NOT EXISTS income (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Fixed expenses table
        db.run(`CREATE TABLE IF NOT EXISTS fixed_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            charge_date INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Savings deposits table
        db.run(`CREATE TABLE IF NOT EXISTS savings_deposits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Investments table
        db.run(`CREATE TABLE IF NOT EXISTS investments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Discretionary transactions table
        db.run(`CREATE TABLE IF NOT EXISTS discretionary_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Gas transactions table
        db.run(`CREATE TABLE IF NOT EXISTS gas_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Budget settings table
        db.run(`CREATE TABLE IF NOT EXISTS budget_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discretionary_budget REAL DEFAULT 0,
            gas_budget REAL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
}

// API Routes

// Get all budget data
app.get('/api/budget-data', (req, res) => {
    const budgetData = {
        income: [],
        fixedExpenses: [],
        savings: {
            deposits: [],
            investments: []
        },
        discretionary: {
            budget: 0,
            transactions: []
        },
        gas: {
            budget: 0,
            transactions: []
        }
    };

    // Get income
    db.all('SELECT * FROM income ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        budgetData.income = rows;

        // Get fixed expenses
        db.all('SELECT * FROM fixed_expenses', [], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            budgetData.fixedExpenses = rows;

            // Get savings deposits
            db.all('SELECT * FROM savings_deposits ORDER BY date DESC', [], (err, rows) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: err.message });
                }
                budgetData.savings.deposits = rows;

                // Get investments
                db.all('SELECT * FROM investments ORDER BY date DESC', [], (err, rows) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: err.message });
                    }
                    budgetData.savings.investments = rows;

                    // Get discretionary transactions
                    db.all('SELECT * FROM discretionary_transactions ORDER BY date DESC', [], (err, rows) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ error: err.message });
                        }
                        budgetData.discretionary.transactions = rows;

                        // Get gas transactions
                        db.all('SELECT * FROM gas_transactions ORDER BY date DESC', [], (err, rows) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ error: err.message });
                            }
                            budgetData.gas.transactions = rows;

                            // Get budget settings
                            db.get('SELECT * FROM budget_settings ORDER BY updated_at DESC LIMIT 1', [], (err, row) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).json({ error: err.message });
                                }
                                if (row) {
                                    budgetData.discretionary.budget = row.discretionary_budget;
                                    budgetData.gas.budget = row.gas_budget;
                                }
                                res.json(budgetData);
                            });
                        });
                    });
                });
            });
        });
    });
});

// Save income
app.post('/api/income', (req, res) => {
    const { amount, date, description } = req.body;
    db.run('INSERT INTO income (amount, date, description) VALUES (?, ?, ?)',
        [amount, date, description],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
});

// Save fixed expense
app.post('/api/fixed-expenses', (req, res) => {
    const { name, amount, chargeDate } = req.body;
    db.run('INSERT INTO fixed_expenses (name, amount, charge_date) VALUES (?, ?, ?)',
        [name, amount, chargeDate],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
});

// Save savings deposit
app.post('/api/savings-deposits', (req, res) => {
    const { amount, date, description } = req.body;
    db.run('INSERT INTO savings_deposits (amount, date, description) VALUES (?, ?, ?)',
        [amount, date, description],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
});

// Save investment
app.post('/api/investments', (req, res) => {
    const { amount, date, description } = req.body;
    db.run('INSERT INTO investments (amount, date, description) VALUES (?, ?, ?)',
        [amount, date, description],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
});

// Save discretionary transaction
app.post('/api/discretionary-transactions', (req, res) => {
    const { amount, date, description } = req.body;
    db.run('INSERT INTO discretionary_transactions (amount, date, description) VALUES (?, ?, ?)',
        [amount, date, description],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
});

// Save gas transaction
app.post('/api/gas-transactions', (req, res) => {
    const { amount, date, description } = req.body;
    db.run('INSERT INTO gas_transactions (amount, date, description) VALUES (?, ?, ?)',
        [amount, date, description],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
});

// Update budget settings
app.post('/api/budget-settings', (req, res) => {
    const { discretionaryBudget, gasBudget } = req.body;
    db.run('INSERT INTO budget_settings (discretionary_budget, gas_budget) VALUES (?, ?)',
        [discretionaryBudget, gasBudget],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
});

// Delete routes
app.delete('/api/income/:id', (req, res) => {
    db.run('DELETE FROM income WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

app.delete('/api/fixed-expenses/:id', (req, res) => {
    db.run('DELETE FROM fixed_expenses WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

app.delete('/api/savings-deposits/:id', (req, res) => {
    db.run('DELETE FROM savings_deposits WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

app.delete('/api/investments/:id', (req, res) => {
    db.run('DELETE FROM investments WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

app.delete('/api/discretionary-transactions/:id', (req, res) => {
    db.run('DELETE FROM discretionary_transactions WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

app.delete('/api/gas-transactions/:id', (req, res) => {
    db.run('DELETE FROM gas_transactions WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Add health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
}); 