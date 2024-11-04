const { Investment, User } = require('../config')
const axios = require('axios');
const fs = require('fs')
const yahooFinance = require('yahoo-finance2').default;


const wellKnownStocks = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
  'META', 'NVDA', 'NFLX', 'BRK.B', 'JPM',
  'V', 'DIS', 'ADBE', 'PYPL', 'CMCSA',
  'PFE', 'INTC', 'AMD', 'PEP', 'KO',
  'XOM', 'T', 'VZ', 'CVX', 'MRK',
  'NKE', 'WMT', 'IBM', 'BA', 'PG',
  'MA', 'LLY', 'MCD', 'UNH', 'COST',
  'HD', 'MDT', 'ABT', 'ORCL', 'CRM'
];

const cache = new Map();



const getStocks = async (req, res) => {
  try {
    const formattedData = await getAllStockSymbols('US')

    res.status(200).json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  } 
}



const getAllStockSymbols = async (exchange) =>{
  const url = `https://finnhub.io/api/v1/stock/symbol?exchange=${exchange}&token=${process.env.FINNHUB_API_KEY}`;

  try {
      const response = await axios.get(url);

      const stocks = response.data.map(stock => ({
          symbol: stock.symbol,
          name: stock.description,
          logoUrl: stock.logo || 'N/A',
      }));
      

      fs.writeFileSync('stocks.json', JSON.stringify(stocks, null, 2), 'utf-8');
      console.log(stocks)
      return stocks
  } catch (error) {
      console.error('Error fetching stock symbols:', error);
      return [];
  }
}

const getStockBySymbol = async (req, res) => {
  try {
    const formattedData = await getStockName('AAPL')

    res.status(200).json({formattedData});
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

const getStockName = (symbol) => {
  try {
      // Read the stocks.json file
      const data = fs.readFileSync('stocks.json', 'utf-8');
      const stocks = JSON.parse(data);

      // Find the stock by its symbol
      const stock = stocks.find(stock => stock.symbol === symbol);

      if (stock) {
          return stock.name;
      } else {
          return `Stock with symbol ${symbol} not found.`;
      }
  } catch (error) {
      console.error('Error reading stocks.json file:', error);
      return 'An error occurred while searching for the stock.';
  }
}


const getStockPrice = async (symbol) => {
  try {
    const priceResponse = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`);
    
    // Fetch company profile data for name, logo, and website
    const profileResponse = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`);
    const response = {
      symbol,
      name: getStockName(symbol),
      currentPrice: priceResponse.data.c,
      companyName: profileResponse.data.name,
      logoUrl: profileResponse.data.logo,
      website: profileResponse.data.weburl,
      highPrice: priceResponse.data.h,
      lowPrice: priceResponse.data.l,
      openPrice: priceResponse.data.o,
      previousClosePrice: priceResponse.data.pc,
    };

    console.log(response)
    return response
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
};

const getTop40Stocks = async (req, res) => {
  try {
    const stockDataPromises = wellKnownStocks.map(symbol => getStockPrice(symbol));
    const stockDataArray = await Promise.all(stockDataPromises);

    // Filter out any stocks that returned null (due to errors)
    const validStockData = stockDataArray.filter(stock => stock !== null);

    // Sort stocks by highest current price (you can modify this to sort by another criterion)
    const sortedStocks = validStockData.sort((a, b) => b.currentPrice - a.currentPrice);

    // Return the top 40 stocks
    const top40Stocks = sortedStocks.slice(0, 40);

    res.status(200).json(top40Stocks);
  } catch (error) {
    console.error('Error fetching top 40 stocks:', error);
    res.status(500).json({ error: 'Failed to fetch top 40 stocks' });
  }
};






const getBatchStocks = async (req, res) => {
  try {
    const topStocks = await getStockData(wellKnownStocks); // Pass an array of symbols

    res.status(200).json(topStocks);
  } catch (error) {
    console.error('Error fetching top 40 stocks:', error);
    res.status(500).json({ error: 'Failed to fetch top 40 stocks' });
  }
};


const getStockData = async (symbols) => {
  const cachedData = [];
  const symbolsToFetch = [];

  const stocksData = JSON.parse(fs.readFileSync('stocks.json', 'utf-8'));

  // Separate cached and non-cached symbols
  symbols.forEach((symbol) => {
    if (cache.has(symbol)) {
      cachedData.push(cache.get(symbol));
    } else {
      symbolsToFetch.push(symbol);
    }
  });

  if (symbolsToFetch.length > 0) {
    try {
      // Make the API call for the remaining symbols
      for (const symbol of symbolsToFetch) {
        const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`);
        
        const filteredStocks = stocksData.find(stock => stock.symbol === symbol);

        // Assuming the API returns an object with stock data
        const data = {
          symbol,
          name: filteredStocks.name,
          logoUrl: filteredStocks.logoUrl,
          currentPrice: response.data.c,
          highPrice: response.data.h,
          lowPrice: response.data.l,
          openPrice: response.data.o,
          previousClosePrice: response.data.pc,
        };
        
        // Cache the result
        cache.set(symbol, data);
        cachedData.push(data);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  return cachedData;
};

const getTop40Data = async (req, res) => {
  try {
    const stocksData = JSON.parse(fs.readFileSync('stocks.json', 'utf-8'));

    // Filter stocks based on the well-known symbols
    const filteredStocks = stocksData.filter(stock => wellKnownStocks.includes(stock.symbol));

    // Write the filtered data back to the JSON file (if needed)
    //fs.writeFileSync('filteredStocks.json', JSON.stringify(filteredStocks, null, 2), 'utf-8');

    // Return the filtered data in the API response
    res.status(200).json(filteredStocks);


  } catch (error) {
    console.error('Error updating stock logos:', error);
  }
};


const updateStockLogos = async (req, res) => {
  try {
    const stocksData = JSON.parse(fs.readFileSync('stocks.json', 'utf-8'));

    for (const stock of stocksData) {
      try {
        //const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${stock.symbol}&token=${process.env.FINNHUB_API_KEY}`);

        // Update the stock object with the logo URL if it exists
        symbol = stock.symbol
        if(stock.symbol === 'META'){
          symbol = 'FB'
        }
        stock.logoUrl = `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${symbol}.png`;
        
      } catch (err) {
        console.error(`Error fetching logo for ${stock.symbol}:`, err);
      }
    }

    // Write the updated data back to the JSON file
    fs.writeFileSync('stocks.json', JSON.stringify(stocksData, null, 2), 'utf-8');
    console.log('Stock logos updated successfully.');
    res.status(200).json({message:'Stock logos updated successfully.'});

  } catch (error) {
    console.error('Error updating stock logos:', error);
  }
};


const stockHistory = async (req, res) => {
  const { symbol } = req.query;
  try {
    const historicalData = await getHistoricalData(symbol); // Await the response

    if (historicalData) {
      // Successful response from the API
      res.status(200).json(historicalData);
    } else {
      // Handle the case where data is not available
      res.status(404).json({ error: 'No historical data found for the given symbol' });
    }

  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
}

// Function to get historical data
const getHistoricalData = async (symbol) => {
  const now = Math.floor(new Date().getTime() / 1000); // Today's timestamp in seconds
  const sixMonthsAgo = Math.floor(new Date().setMonth(new Date().getMonth() - 6) / 1000); // 6 months ago

  try {
    const historicalData = await yahooFinance.historical(symbol, { period1: sixMonthsAgo, period2: now });


    return historicalData; // This will contain the historical data

  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw new Error('Failed to fetch historical data');
  }
};

module.exports = { getStocks, getStockData, getStockBySymbol, getTop40Stocks, getBatchStocks, updateStockLogos, getTop40Data, getStockPrice, stockHistory }