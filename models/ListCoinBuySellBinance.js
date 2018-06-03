/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <tin@ltv.vn> on Jan 04, 2018
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relationship = require("mongoose-relationship");

const listCoinBuySellBinanceSchema = new mongoose.Schema({
  marketNm: String,
  buy_pri: Number,
  enterTime: String,
  percentSell: String,
  type: String,
  orderId: String,
  qty: Number,
  rate: Number,
  status: String
}, {
  timestamps: true
});

const ListCoinBuySellBinance = mongoose.model('ListCoinBuySellBinance', listCoinBuySellBinanceSchema);
module.exports = ListCoinBuySellBinance;
