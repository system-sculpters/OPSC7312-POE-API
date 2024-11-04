const { Investment, User } = require('../config')
const { getStockPrice, getStockData } = require('./stockController')
const axios = require('axios');
const cache = new Map();

const getUserInvestments = async (req, res) => {
    const { id } = req.params
   
    try {
        const snapshot = await Investment
            .where('userid', '==', id)
            .get()

        const investments = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }));
    
        const symbols = [...new Set(investments.map(investment => investment.symbol))];
         
        const userDoc = await User.doc(id).get();
        const userData = userDoc.data();
        const currentBalance = userData.balance;
  
        console.log(symbols);
        
        // Get stock data for these symbols
        const stockData = await getStockData(symbols);
            
        console.log(stockData);
        
        // Map the stock data to the investments
        const investmentsWithStockData = investments.map(investment => {
            const stock = stockData.find(s => s.symbol === investment.symbol);
            return { ...investment, stockData: stock || {} };
        });

        console.log(investmentsWithStockData);
        res.status(200).json({investments: investmentsWithStockData, balance: currentBalance});
    } catch (error) {
      console.error('Error fetching user investments:', error);
      res.status(500).json({ error: 'Failed to investments' });
    }
}


const getUserInvestment = async (req, res) => {
    const { userid, symbol } = req.query;

    if (!userid || !symbol) {
        return res.status(400).json({ error: 'User ID and symbol are required.' });
    }
    
    try {
        // Query for the user's specific investment in the given stock symbol
        const userInvestmentQuery = await Investment
            .where('userid', '==', userid)
            .where('symbol', '==', symbol)
            .get();

        if (!userInvestmentQuery.empty) {
            // Get the first document, as there should only be one investment for the user-symbol pair
            const investmentDoc = userInvestmentQuery.docs[0];
            const investmentData = { id: investmentDoc.id, ...investmentDoc.data() };

            res.status(200).json(investmentData);
        } else {
            res.status(404).json({ error: 'Investment not found for the given stock symbol.' });
        }
    } catch (error) {
        console.error('Error fetching user investment:', error);
        res.status(500).json({ error: 'Failed to retrieve investment.' });
    }
};

  
const buyInvestment = async (req, res) => {
    const { userid, symbol, quantity } = req.body;
    try {
        // Get the user's current balance
        const userDoc = await User.doc(userid).get();
        const userData = userDoc.data();
        const currentBalance = userData.balance;
  
        // Get the current stock price
        const stockData = await getStockPrice(symbol);
        const totalCost = stockData.currentPrice * quantity;
  
        // Check if the user has enough balance
        if (currentBalance >= totalCost) {
            // Deduct the cost from the user's balance
            const newBalance = currentBalance - totalCost;
            await User.doc(userid).update({ balance: newBalance });
  
            // Check if the user already has an investment in this stock
            const existingInvestmentQuery = await Investment
                .where('userid', '==', userid)
                .where('symbol', '==', symbol)
                .get();
  
            if (!existingInvestmentQuery.empty) {
                // User already owns some of this stock, update the investment
                const existingInvestment = existingInvestmentQuery.docs[0];
                const newQuantity = existingInvestment.data().quantity + quantity;
                const newTotalInvested = existingInvestment.data().totalInvested + totalCost;
                const newCurrentValue = stockData.currentPrice * newQuantity;
  
                await Investment.doc(existingInvestment.id).update({
                    quantity: newQuantity,
                    totalInvested: newTotalInvested,
                    currentValue: newCurrentValue,
                });
            } else {
                // User does not own this stock yet, create a new investment
                const newInvestment = {
                    userid,
                    symbol,
                    quantity,
                    totalInvested: totalCost,
                    currentValue: stockData.currentPrice * quantity,
                    purchasePrice: stockData.currentPrice,
                    purchaseDate: Date.now(),
                };
                await Investment.add(newInvestment);
            }
  
            res.status(200).json({ message: 'Investment purchased successfully', newBalance });
        } else {
            res.status(400).json({ error: 'Insufficient balance to complete the purchase.' });
        }
    } catch (error) {
        console.error('Error buying investment:', error);
        res.status(500).json({ error: 'Failed to purchase investment.' });
    }
  };
  
  const sellInvestment = async (req, res) => {
    const { userid, symbol, quantity } = req.body;
  
    try {
        // Get the user's investment in the stock
        const existingInvestmentQuery = await Investment
            .where('userid', '==', userid)
            .where('symbol', '==', symbol)
            .get();
  
        if (!existingInvestmentQuery.empty) {
            const existingInvestment = existingInvestmentQuery.docs[0];
            const currentQuantity = existingInvestment.data().quantity;
  
            // Check if the user owns enough quantity to sell
            if (currentQuantity >= quantity) {
                // Get the current stock price
                const stockData = await getStockPrice(symbol);
                const saleProceeds = stockData.currentPrice * quantity;
  
                // Add the proceeds to the user's balance
                const userDoc = await User.doc(userid).get();
                const currentBalance = userDoc.data().balance;
                const newBalance = currentBalance + saleProceeds;
                await User.doc(userid).update({ balance: newBalance });
  
                // Update the investment quantity and current value
                const newQuantity = currentQuantity - quantity;
                const newCurrentValue = existingInvestment.data().currentValue - saleProceeds;
  
                if (newQuantity > 0) {
                    await Investment.doc(existingInvestment.id).update({
                        quantity: newQuantity,
                        currentValue: newCurrentValue,
                    });
                } else {
                    await Investment.doc(existingInvestment.id).delete(); // Delete the investment if fully sold
                }
  
                res.status(200).json({ message: 'Investment sold successfully', newBalance });
            } else {
                res.status(400).json({ error: 'Insufficient stock quantity to complete the sale.' });
            }
        } else {
            res.status(401).json({ error: 'No investment found for the given stock symbol.' });
        }
    } catch (error) {
        console.error('Error selling investment:', error);
        res.status(500).json({ error: 'Failed to sell investment.' });
    }
  };


  const getPortfolioValue = async (req, res) => {
    const { id } = req.params
    try {

        const userDoc = await User.doc(id).get();
        let currentBalance = userDoc.data().balance;


        const userInvestmentsSnapshot = await Investment.where('userid', '==', id).get();
        const userInvestments = [];

        userInvestmentsSnapshot.forEach(doc => {
        userInvestments.push(doc.data());
        });

        // Calculate total portfolio value
        let totalPortfolioValue = 0;

        for (const investment of userInvestments) {
        const stockData = await getStockPrice(investment.symbol);
        const currentValue = stockData.currentPrice * investment.quantity;
            totalPortfolioValue += currentValue;
        }

        currentBalance += totalPortfolioValue        

        res.status(200).json({ portfolioValue: currentBalance });
  } catch (error) {
    console.error('Error calculating portfolio value:', error);
    res.status(500).json({ error: 'Failed to calculate portfolio value' });
  }
  }


  module.exports = { getPortfolioValue, getUserInvestments, getUserInvestment, buyInvestment, sellInvestment}