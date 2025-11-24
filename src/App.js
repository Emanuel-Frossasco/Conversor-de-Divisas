import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, RefreshCw, History, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import './App.css';

function App() {
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('ARS');
  const [toCurrency, setToCurrency] = useState('USD');
  const [rates, setRates] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState(null);

  const currencies = [
    { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
    { code: 'USD', name: 'Dólar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'Libra', symbol: '£' },
    { code: 'JPY', name: 'Yen', symbol: '¥' }
  ];

  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = () => {
    try {
      const savedHistory = localStorage.getItem('converter-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

      const savedRates = localStorage.getItem('converter-rates');
      if (savedRates) {
        const ratesData = JSON.parse(savedRates);
        setRates(ratesData.rates);
        setLastUpdate(ratesData.timestamp);
      }
    } catch (err) {
      console.log('Error cargando datos guardados:', err);
    }
  };

  const saveToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('Error guardando en localStorage:', err);
    }
  };

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/ARS');
      if (!response.ok) {
        throw new Error('Error al obtener tasas');
      }
      const data = await response.json();
      if (data.result === 'success') {
        setRates(data.rates);
        const now = new Date().toISOString();
        setLastUpdate(now);
        setIsOnline(true);
        saveToStorage('converter-rates', {
          rates: data.rates,
          timestamp: now
        });
      }
    } catch (err) {
      setError('No se pudo conectar. Usando valores guardados.');
      setIsOnline(false);
      if (!rates) {
        setError('No hay conexión y no hay datos guardados.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rates) {
      fetchRates();
    }
  }, []);

  const convertCurrency = () => {
    if (!rates || !amount) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;
    let convertedAmount;
    if (fromCurrency === 'ARS') {
      convertedAmount = numAmount * rates[toCurrency];
    } else if (toCurrency === 'ARS') {
      convertedAmount = numAmount / rates[fromCurrency];
    } else {
      const toARS = numAmount / rates[fromCurrency];
      convertedAmount = toARS * rates[toCurrency];
    }
    setResult(convertedAmount);
    const newEntry = {
      id: Date.now(),
      from: fromCurrency,
      to: toCurrency,
      amount: numAmount,
      result: convertedAmount,
      timestamp: new Date().toISOString()
    };
    const newHistory = [newEntry, ...history].slice(0, 20);
    setHistory(newHistory);
    saveToStorage('converter-history', newHistory);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('converter-history');
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getCurrencySymbol = (code) => {
    return currencies.find(c => c.code === code)?.symbol || '';
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <div className="card header-card">
          <div className="header-top">
            <h1 className="title">Conversor de Divisas</h1>
            {isOnline ? (
              <Wifi className="icon-online" size={24} />
            ) : (
              <WifiOff className="icon-offline" size={24} />
            )}
          </div>
          {lastUpdate && (
            <p className="last-update">
              Última actualización: {new Date(lastUpdate).toLocaleString('es-AR')}
            </p>
          )}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Convertidor */}
        <div className="card converter-card">
          <div className="converter-content">
            {/* Desde */}
            <div className="input-group">
              <label className="label">Desde</label>
              <div className="input-row">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-amount"
                  placeholder="Monto" />
                <select
                  value={fromCurrency}
                  onChange={(e) => {
                    setFromCurrency(e.target.value);
                    setResult(null);
                  }}
                  className="select-currency">
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Botón de intercambio */}
            <div className="swap-button-container">
              <button onClick={swapCurrencies} className="swap-button">
                <ArrowLeftRight />
              </button>
            </div>
            {/* Hasta */}
            <div className="input-group">
              <label className="label">Hasta</label>
              <select
                value={toCurrency}
                onChange={(e) => {
                  setToCurrency(e.target.value);
                  setResult(null);
                }}
                className="select-currency full-width">
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Botones de acción */}
            <div className="action-buttons">
              <button
                onClick={convertCurrency}
                disabled={loading || !rates}
                className="btn btn-primary">
                Convertir
              </button>
              <button
                onClick={fetchRates}
                disabled={loading}
                className="btn btn-success">
                <RefreshCw className={loading ? 'spin' : ''} size={20} />
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="btn btn-purple">
                <History size={20} />
              </button>
            </div>
            {/* Resultado */}
            {result !== null && (
              <div className="result-box">
                <p className="result-label">Resultado:</p>
                <p className="result-amount">
                  {getCurrencySymbol(toCurrency)} {formatNumber(result)} {toCurrency}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Historial */}
        {showHistory && (
          <div className="card history-card">
            <div className="history-header">
              <h2 className="history-title">
                <History size={24} />
                Historial de Conversiones
              </h2>
              <button onClick={clearHistory} className="btn-clear">
                Limpiar todo
              </button>
            </div>
            {history.length === 0 ? (
              <p className="empty-history">No hay conversiones registradas</p>
            ) : (
              <div className="history-list">
                {history.map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div className="history-item-content">
                      <p className="history-conversion">
                        {getCurrencySymbol(entry.from)} {formatNumber(entry.amount)} {entry.from}
                        <span className="arrow">→</span>
                        {getCurrencySymbol(entry.to)} {formatNumber(entry.result)} {entry.to}
                      </p>
                      <p className="history-date">
                        {new Date(entry.timestamp).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Info sobre tasas */}
        {rates && (
          <div className="card rates-card">
            <h3 className="rates-title">Tasas Actuales (base ARS)</h3>
            <div className="rates-grid">
              <div className="rate-item">
                <span className="rate-label">USD:</span> {rates.USD?.toFixed(6)}
              </div>
              <div className="rate-item">
                <span className="rate-label">EUR:</span> {rates.EUR?.toFixed(6)}
              </div>
              <div className="rate-item">
                <span className="rate-label">GBP:</span> {rates.GBP?.toFixed(6)}
              </div>
              <div className="rate-item">
                <span className="rate-label">JPY:</span> {rates.JPY?.toFixed(6)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;