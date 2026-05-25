/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SimulationResult {
  amountUSD: number;
  exchangeRate: number;
  amountMXN: number;
  traditionalFee: number;
  traditionalTime: string;
  traditionalTotalUSD: number;
  swassFee: number;
  swassTime: string;
  swassTotalUSD: number;
  savingsUSD: number;
  savingsPercentage: number;
}

export interface DemoBooking {
  id: string;
  name: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  monthlyVolume: string; // "<$10k", "$10k-$50k", "$50k-$250k", "$250k+"
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  createdAt: string;
}

export interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  tagline: string;
}

export interface TickerRate {
  pair: string;
  rate: number;
  change: number;
}
