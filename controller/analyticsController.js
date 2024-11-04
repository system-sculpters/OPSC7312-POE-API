const { Transaction, Category, Goal} = require('../config')

const getTransactionsByMonth = async (req, res) => {
    const { id } = req.params;
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Start of the month 12 months ago

    try {
        const snapshot = await Transaction
            .where('userid', '==', id) // Access the nested `userid`
            .where('date', '>=', twelveMonthsAgo.getTime())
            .get();

        console.log(`Found ${snapshot.size} transactions for userid: ${id}`);
        
        if (snapshot.empty) {
            console.log('No matching transactions.');
            return res.status(200).json([]);
        }

        const transactions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                date: new Date(data.date), // Assuming `data.date` is stored as a timestamp
            };
        });

        // Group Transactions by Month and Year
        const transactionsByMonth = transactions.reduce((acc, transaction) => {
            const monthYear = `${transaction.date.getMonth() + 1}-${transaction.date.getFullYear()}`;

            if (!acc[monthYear]) {
                acc[monthYear] = { income: 0, expense: 0, count: 0 };
            }

            if (transaction.type === 'INCOME') {
                acc[monthYear].income += transaction.amount; // Add to income
            } else if (transaction.type === 'EXPENSE') {
                acc[monthYear].expense += transaction.amount; // Add to expense
            }

            acc[monthYear].count += 1; // Increment the count
            return acc;
        }, {});

        // Fill in Missing Months
        const monthlyTransactions = [];
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;

            monthlyTransactions.push({
                label: date.toLocaleString('default', { month: 'long', year: 'numeric' }).substring(0, 3),
                income: transactionsByMonth[monthYear]?.income || 0,
                expense: transactionsByMonth[monthYear]?.expense || 0,
                count: transactionsByMonth[monthYear]?.count || 0
            });
        }

        res.status(200).json(monthlyTransactions);
    } catch (error) {
        console.error('Error getting transactions by month:', error);
        res.status(500).json({ error: 'Failed to fetch transactions by month' });
    }
};




const getExpenseCategoryStats = async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch all categories
        const categorySnapshot = await Category.where('userid', '==', id).get();
        const categories = categorySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name, 
            color: doc.data().color,
        }));
        //return res.status(200).json({ categories });

        // Fetch all transactions for the user
        const transactionSnapshot = await Transaction
        .where('userid', '==', id).get();

        if (transactionSnapshot.empty) {
            console.log(`No transactions found for userid: ${id}`);
            // Return all categories with zero amounts
            const emptyCategories = categories.map(category => ({
                categoryId: category.id,
                name: category.name,
                color: category.color,
                totalAmount: 0,
                transactionCount: 0,
                
            }));
            return res.status(200).json(  emptyCategories );
        }

        const transactions = transactionSnapshot.docs.map(doc => doc.data());
        console.log(transactions)
        // Filter only expenses
        const expenses = transactions.filter(transaction => transaction.type === 'EXPENSE');
        console.log(`Expenses: ${JSON.stringify(expenses)}`)
        // Calculate the total amount spent per category
        const categoryStats = expenses.reduce((acc, expense) => {
            const { categoryId, amount } = expense;

            console.log(`${categoryId} - ${amount}`)
            if (!acc[categoryId]) {
                acc[categoryId] = { total: 0, count: 0 };
            }

            acc[categoryId].total += amount;
            acc[categoryId].count += 1;
            console.log(`${acc[categoryId].total} - ${acc[categoryId].count }`)
            return acc;
        }, {});

        // Combine all categories with calculated stats, ensuring all categories are included
        const formattedStats = categories.map(category => ({
                categoryId: category.id,
                name: category.name,
                color: category.color,
                totalAmount: categoryStats[category.id]?.total || 0,
                transactionCount: categoryStats[category.id]?.count || 0,
            }
        ));

        res.status(200).json(formattedStats);
    } catch (error) {
        console.error('Error getting expense category stats:', error);
        res.status(500).json({ error: 'Failed to fetch expense category stats' });
    }
};


const getTransactionsForLast7Days = async (req, res) => {
    const { id } = req.params;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6); // 7 days ago, inclusive of today

    try {
        const snapshot = await Transaction
            .where('userid', '==', id)
            .where('date', '>=', sevenDaysAgo.getTime())
            .get();

        console.log(`Found ${snapshot.size} transactions for userid: ${id}`);

        if (snapshot.empty) {
            console.log('No matching transactions.');
            return res.status(200).json([]);
        }

        const transactions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                date: new Date(data.date), // Assuming `data.date` is stored as a timestamp
            };
        });

        // Group Transactions by Day of the Week
        const transactionsByDay = transactions.reduce((acc, transaction) => {
            const day = transaction.date.toLocaleString('default', { weekday: 'short' }); // Get weekday, e.g., 'Mon'

            if (!acc[day]) {
                acc[day] = { income: 0, expense: 0, count: 0 };
            }

            if (transaction.type === 'INCOME') {
                acc[day].income += transaction.amount; // Add to income
            } else if (transaction.type === 'EXPENSE') {
                acc[day].expense += transaction.amount; // Add to expense
            }

            acc[day].count += 1; // Increment the count
            return acc;
        }, {});

        // Fill in Missing Days
        const dailyTransactions = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const day = date.toLocaleString('default', { weekday: 'short' });

            dailyTransactions.push({
                label: day,
                income: transactionsByDay[day]?.income || 0,
                expense: transactionsByDay[day]?.expense || 0,
                count: transactionsByDay[day]?.count || 0
            });
        }

        res.status(200).json(dailyTransactions);
    } catch (error) {
        console.error('Error getting transactions for last 7 days:', error);
        res.status(500).json({ error: 'Failed to fetch transactions for last 7 days' });
    }
};


// const getDashboardData = async (req, res) => {
//     const { id } = req.params;
//     const now = new Date();
//     const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Start of the month 12 months ago
//     const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6); // 7 days ago

//     try {
//         const goalSnapshot = await Goal
//         .where('userid', '==', id)
//         .get();
        
//         const goalList = goalSnapshot.docs
//             .map(doc => ({ id: doc.id, ...doc.data() }));
//         // Fetch transactions for the last 12 months
//         const transactionSnapshot = await Transaction
//             .where('userid', '==', id)
//             .where('date', '>=', twelveMonthsAgo.getTime())
//             .get();
        
//         if (transactionSnapshot.empty) {
//             console.log(`No transactions found for userid: ${id}`);
//             return res.status(200).json({
//                 transactionsByMonth: [],
//                 dailyTransactions: [],
//                 categoryStats: [],
//                 goals: goalList
//             });
//         }

//         const transactions = transactionSnapshot.docs.map(doc => {
//             const data = doc.data();
//             return {
//                 ...data,
//                 date: new Date(data.date), // Assuming `data.date` is stored as a timestamp
//             };
//         });

//         // Group Transactions by Month and Year (for 12 months)
//         const transactionsByMonth = transactions.reduce((acc, transaction) => {
//             const monthYear = `${transaction.date.getMonth() + 1}-${transaction.date.getFullYear()}`;
//             if (!acc[monthYear]) {
//                 acc[monthYear] = { income: 0, expense: 0, count: 0 };
//             }
//             if (transaction.type === 'INCOME') {
//                 acc[monthYear].income += transaction.amount;
//             } else if (transaction.type === 'EXPENSE') {
//                 acc[monthYear].expense += transaction.amount;
//             }
//             acc[monthYear].count += 1;
//             return acc;
//         }, {});

//         // Fill in Missing Months
//         const monthlyTransactions = [];
//         for (let i = 0; i < 12; i++) {
//             const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
//             const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
//             monthlyTransactions.push({
//                 label: date.toLocaleString('default', { month: 'long', year: 'numeric' }).substring(0, 3),
//                 income: transactionsByMonth[monthYear]?.income || 0,
//                 expense: transactionsByMonth[monthYear]?.expense || 0,
//                 count: transactionsByMonth[monthYear]?.count || 0
//             });
//         }

//         // Group Transactions by Day of the Week (for last 7 days)
//         const transactionsByDay = transactions.reduce((acc, transaction) => {
//             const day = transaction.date.toLocaleString('default', { weekday: 'short' });
//             if (!acc[day]) {
//                 acc[day] = { income: 0, expense: 0, count: 0 };
//             }
//             if (transaction.type === 'INCOME') {
//                 acc[day].income += transaction.amount;
//             } else if (transaction.type === 'EXPENSE') {
//                 acc[day].expense += transaction.amount;
//             }
//             acc[day].count += 1;
//             return acc;
//         }, {});

//         // Fill in Missing Days
//         const dailyTransactions = [];
//         for (let i = 0; i < 7; i++) {
//             const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
//             const day = date.toLocaleString('default', { weekday: 'short' });
//             dailyTransactions.push({
//                 label: day,
//                 income: transactionsByDay[day]?.income || 0,
//                 expense: transactionsByDay[day]?.expense || 0,
//                 count: transactionsByDay[day]?.count || 0
//             });
//         }

//         // Fetch all categories for expense stats
//         const categorySnapshot = await Category.where('userid', '==', id).get();
//         const categories = categorySnapshot.docs.map(doc => ({
//             id: doc.id,
//             name: doc.data().name, 
//             color: doc.data().color,
//         }));

//         // Filter only expenses for category stats
//         const expenses = transactions.filter(transaction => transaction.type === 'EXPENSE');

//         // Calculate total amount per category
//         const categoryStats = expenses.reduce((acc, expense) => {
//             const { categoryId, amount } = expense;
//             if (!acc[categoryId]) {
//                 acc[categoryId] = { total: 0, count: 0 };
//             }
//             acc[categoryId].total += amount;
//             acc[categoryId].count += 1;
//             return acc;
//         }, {});

//         // Combine all categories with calculated stats
//         const formattedStats = categories.map(category => ({
//             categoryId: category.id,
//             name: category.name,
//             color: category.color,
//             totalAmount: categoryStats[category.id]?.total || 0,
//             transactionCount: categoryStats[category.id]?.count || 0
//         }));

//         // Send all the data in one response
//         res.status(200).json({
//             transactionsByMonth: monthlyTransactions,
//             dailyTransactions: dailyTransactions,
//             categoryStats: formattedStats,
//             goals: goalList
//         });
//     } catch (error) {
//         console.error('Error fetching dashboard data:', error);
//         res.status(500).json({ error: 'Failed to fetch dashboard data' });
//     }
// };


const getDashboardData = async (req, res) => {
    const { id } = req.params;
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Start of the month 12 months ago
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6); // 7 days ago


    try {
        // Fetch all data in parallel
        const [goalSnapshot, transactionSnapshot, categorySnapshot] = await Promise.all([
            Goal.where('userid', '==', id).get(),
            Transaction.where('userid', '==', id).where('date', '>=', twelveMonthsAgo.getTime()).get(),
            Category.where('userid', '==', id).get()
        ]);

        const goalList = goalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const transactions = transactionSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                date: new Date(data.date), // Assuming `data.date` is stored as a timestamp
            };
        });

        const categories = categorySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            color: doc.data().color,
        }));

        // Group Transactions by Month for the last 12 months
        const transactionsByMonth = groupTransactionsByMonth(transactions, now);

        // Group Transactions by Day of the Week for the last 7 days
        const dailyTransactions = groupTransactionsByDay(transactions, now);

        // Calculate category stats for expenses
        const categoryStats = calculateCategoryStats(transactions, categories);

        // Send all the data in one response
        res.status(200).json({
            transactionsByMonth,
            dailyTransactions,
            categoryStats,
            goals: goalList
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};

// Helper function to group transactions by month
const groupTransactionsByMonth = (transactions, now) => {
   
    const transactionsByMonth = transactions.reduce((acc, transaction) => {
        const monthYear = `${transaction.date.getMonth() + 1}-${transaction.date.getFullYear()}`;
        if (!acc[monthYear]) {
            acc[monthYear] = { income: 0, expense: 0, count: 0 };
        }
        if (transaction.type === 'INCOME') {
            acc[monthYear].income += transaction.amount;
        } else if (transaction.type === 'EXPENSE') {
            acc[monthYear].expense += transaction.amount;
        }
        acc[monthYear].count += 1;
        return acc;
    }, {});
    // Fill in Missing Months
    const monthlyTransactions = [];
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
        monthlyTransactions.push({
            label: date.toLocaleString('default', { month: 'long', year: 'numeric' }).substring(0, 3),
            income: transactionsByMonth[monthYear]?.income || 0,
            expense: transactionsByMonth[monthYear]?.expense || 0,
            count: transactionsByMonth[monthYear]?.count || 0
        });
    }
    return monthlyTransactions;
};

// Helper function to group transactions by day of the week for the last 7 days
const groupTransactionsByDay = (transactions, now) => {
    const transactionsByDay = transactions.reduce((acc, transaction) => {
        const day = transaction.date.toLocaleString('default', { weekday: 'short' });
        if (!acc[day]) {
            acc[day] = { income: 0, expense: 0, count: 0 };
        }
        if (transaction.type === 'INCOME') {
            acc[day].income += transaction.amount;
        } else if (transaction.type === 'EXPENSE') {
            acc[day].expense += transaction.amount;
        }
        acc[day].count += 1;
        return acc;
    }, {});

    // Fill in Missing Days
    const dailyTransactions = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const day = date.toLocaleString('default', { weekday: 'short' });
        dailyTransactions.push({
            label: day,
            income: transactionsByDay[day]?.income || 0,
            expense: transactionsByDay[day]?.expense || 0,
            count: transactionsByDay[day]?.count || 0
        });
    }
    return dailyTransactions;
};

// Helper function to calculate category statistics for expenses
const calculateCategoryStats = (transactions, categories) => {
    const expenses = transactions.filter(transaction => transaction.type === 'EXPENSE');

    // Calculate total amount per category
    const categoryStats = expenses.reduce((acc, expense) => {
        const { categoryId, amount } = expense;
        if (!acc[categoryId]) {
            acc[categoryId] = { total: 0, count: 0 };
        }
        acc[categoryId].total += amount;
        acc[categoryId].count += 1;
        return acc;
    }, {});

    // Combine all categories with calculated stats
    return categories.map(category => ({
        categoryId: category.id,
        name: category.name,
        color: category.color,
        totalAmount: categoryStats[category.id]?.total || 0,
        transactionCount: categoryStats[category.id]?.count || 0
    }));
};




module.exports = { getTransactionsByMonth, getExpenseCategoryStats, getTransactionsForLast7Days, getDashboardData }