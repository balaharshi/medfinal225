import * as enbdpayService from '../services/enbdpayService.js';
import { logger } from '../utils/logger.js';

export const createEnbdpayCheckout = async (req, res) => {
  const checkout = await enbdpayService.createCheckoutTransaction(req.body);
  res.status(201).json({ success: true, checkout });
};

export const getEnbdpayStatus = async (req, res) => {
  const status = await enbdpayService.checkCheckoutStatus({
    appUtr: req.query.appUtr,
    transactionUtr: req.query.transactionUtr,
  });
  res.json({ success: true, status });
};

export const enbdpayWebhook = async (req, res) => {
  logger.info('ENBDpay webhook received');
  const result = await enbdpayService.recordWebhookPaymentStatus(req.body, req.headers);
  res.status(200).json({ success: true, ...result });
};
