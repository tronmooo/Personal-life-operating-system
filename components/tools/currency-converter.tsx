'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowLeftRight, DollarSign } from 'lucide-react'

// Popular currencies with approximate rates (in production, use a real API)
const currencies = [
  { code: 'USD', name: 'US Dollar', rate: 1.0, symbol: '$' },
  { code: 'EUR', name: 'Euro', rate: 0.92, symbol: '€' },
  { code: 'GBP', name: 'British Pound', rate: 0.79, symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', rate: 149.5, symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', rate: 1.53, symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', rate: 1.36, symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', rate: 0.88, symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', rate: 7.24, symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', rate: 83.12, symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', rate: 17.05, symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', rate: 4.98, symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', rate: 18.76, symbol: 'R' },
  { code: 'KRW', name: 'South Korean Won', rate: 1329.5, symbol: '₩' },
  { code: 'SGD', name: 'Singapore Dollar', rate: 1.34, symbol: 'S$' },
  { code: 'NZD', name: 'New Zealand Dollar', rate: 1.65, symbol: 'NZ$' },
]

export function CurrencyConverter() {
  const [amount, setAmount] = useState('100')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('EUR')
  const [result, setResult] = useState<number | null>(null)

  const convertCurrency = () => {
    const amt = parseFloat(amount)
    if (!amt) return

    const fromRate = currencies.find((c) => c.code === fromCurrency)?.rate || 1
    const toRate = currencies.find((c) => c.code === toCurrency)?.rate || 1

    // Convert to USD first, then to target currency
    const usdAmount = amt / fromRate
    const converted = usdAmount * toRate

    setResult(converted)
  }

  const swapCurrencies = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
    if (result) {
      setAmount(result.toFixed(2))
      setResult(parseFloat(amount))
    }
  }

  const fromSymbol = currencies.find((c) => c.code === fromCurrency)?.symbol || ''
  const toSymbol = currencies.find((c) => c.code === toCurrency)?.symbol || ''

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            Currency Converter
          </CardTitle>
          <CardDescription>
            Convert between major world currencies (using approximate exchange rates)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromCurrency">From</Label>
            <select
              id="fromCurrency"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapCurrencies}
              className="rounded-full"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toCurrency">To</Label>
            <select
              id="toCurrency"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={convertCurrency} className="w-full">
            Convert Currency
          </Button>
        </CardContent>
      </Card>

      {result !== null && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Conversion Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {fromSymbol}{parseFloat(amount).toLocaleString()} {fromCurrency}
              </p>
              <p className="text-4xl font-bold text-primary">
                {toSymbol}{result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground mt-2">{toCurrency}</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Exchange Rate</h4>
              <p className="text-sm text-muted-foreground">
                1 {fromCurrency} = {(result / parseFloat(amount)).toFixed(4)} {toCurrency}
              </p>
              <p className="text-sm text-muted-foreground">
                1 {toCurrency} = {(parseFloat(amount) / result).toFixed(4)} {fromCurrency}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-center">
                <p className="text-xs text-muted-foreground">You send</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {fromSymbol}{parseFloat(amount).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                <p className="text-xs text-muted-foreground">They receive</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {toSymbol}{result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <h4 className="font-semibold mb-2 text-sm">Note</h4>
              <p className="text-xs text-muted-foreground">
                These are approximate rates for reference only. For actual transactions, please check with your bank or financial institution as rates fluctuate constantly and may include fees.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">Quick Reference</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[10, 50, 100, 500, 1000].map((amt) => {
                  const converted = (amt / (currencies.find((c) => c.code === fromCurrency)?.rate || 1)) * 
                    (currencies.find((c) => c.code === toCurrency)?.rate || 1)
                  return (
                    <div key={amt} className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">{fromSymbol}{amt}</span>
                      <span className="font-medium">{toSymbol}{converted.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}







