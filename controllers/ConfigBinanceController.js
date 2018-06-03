const _ = require('lodash');
const ListCoinBinance = require('../models/ListCoinBinance');
const moment = require('moment-timezone');
/**
 * Save active coin
 * @param {*} req 
 * @param {*} res 
 */
exports.postSelectCoinActiveCheck = async (req, res) => {
  let saveActive = await ListCoinBinance.findOneAndUpdate({
    marketNm: req.body.marketNm
  }, {
    $set: {
      buy_pri: req.body.buy_pri,
      percentSell: req.body.percentSell,
      activeFlag: req.body.activeFlag == 'Y' ? 'Y' : 'N',
      btcQty: req.body.btcQty
    }
  });
  if (saveActive) {
    req.flash('success', {
      msg: 'Save Success Config Binance.'
    });
    res.redirect('/listCoinBnB');
  } else {
    req.flash('errors', {
      msg: `Something wrong when updating data! (${err.message})`
    });
    res.redirect('/listCoinBnB');
  }
};
/**
 * List BnB
 * @param {*} req 
 * @param {*} res 
 */
exports.getListCoinBnB = async (req, res) => {
  let p0 = await ListCoinBinance.find({});
  let p1 = await ListCoinBinance.find({
    activeFlag: "Y"
  });
  Promise.all([p0, p1])
    .then((data) => {
      res.render('account/listCoinBnB', {
        title: 'List Coin',
        listCoin: data[0],
        listCoinActive: data[1],
      });
    })
    .catch((err) => {
      return next(err);
    });
}
/**
 * Remove Check
 * @param {*} req 
 * @param {*} res 
 */
exports.removeCheckBnB = async (req, res) => {
  const reqCode = req.query.code;
  let delsts = await ListCoinBinance.update({
    marketNm: reqCode
  }, {
    $set: {
      activeFlag: 'N',
    }
  });
  if (delsts) {
    req.flash('success', {
      msg: 'Remove Successfull.'
    });
    return res.redirect('/listCoinBnB');
  } else {
    req.flash(`Remove Fail`);
    return res.redirect('/listCoinBnB');
  }
};
