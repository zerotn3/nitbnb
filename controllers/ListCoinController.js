const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');

const ListCoinBittrex = require('../models/ListCoinBittrex');
const ListCoinTopBittrex = require('../models/ListCoinTopBittrex');
const ListCoinBuySellBittrex = require('../models/ListCoinBuySellBittrex');
const ListCoinBittrexSideWay = require('../models/ListCoinBittrexSideWay');



const url = require('url');
const redirect_after_login = "/dashboard";
const userHelper = require('../helpers/helper').user;
const Config = require('../models/Config');
const constants = require('../config/constants.json');
const UL = constants.UPGRADE_LEVEL;
const moment = require("moment");
const request = require('request-promise');
const UPGRADE_LEVEL = constants.UPGRADE_LEVEL;
const helper = require('../helpers/helper');
const _ = require('lodash');
const WalletTransaction = require('../models/WalletTransaction');
const RequestBtc = require('../models/RequestBtc');

const bittrex = require('node-bittrex-api');
const getStandardDeviation = require('get-standard-deviation');
const BB = require('technicalindicators').BollingerBands;
const ADX = require('technicalindicators').ADX;


const binance = require('node-binance-api');


// let countrun = 0;
// let minutes = 1, the_interval = minutes * 60 * 100;
// setInterval(function () {
//   getBB26();
//   getListCoin();
//   countrun = countrun + 1;
//   console.log("==========Chạy được   " + countrun + "   lần=============")
// }, the_interval);


function getBB(period, stdDev, values) {
  let rs
  let input = {
    period: period,
    values: values,
    stdDev: stdDev

  }
  rs = BB.calculate(input);
  return rs;
}


function checkBetweenTwoBB(marketNm) {
  bittrex.getcandles({
    marketName: marketNm,
    tickInterval: 'thirtyMin'
  }, function (data, err) {
    if (err) {
      return console.error(err);
    }
    let coinArr = data.result;
    let last6candle = coinArr.slice((coinArr.length - 6), coinArr.length)
    let last20candle = coinArr.slice((coinArr.length - 20), coinArr.length)
    let bb62 = getBB(6, 2, last6candle);
    let bb202 = getBB(20, 2, last20candle);


  });
}

const getListCoin = async () => {
  await
  deleteListCoinBeforeScan().then((del) => {
    bittrex.getmarketsummaries(function (data, err) {
      if (err) {
        return console.error(err);
      }
      //Chỉ get cặp BTC va volume > 500
      data.result = _.filter(
        data.result, u => u.MarketName.toString().indexOf('BTC-') > -1
          && u.BaseVolume > 500
        //&& _spread(u.Last, u.Ask, u.Bid) > 0.2
        //&& _checkTrend(u.MarketName) != 'up'
        //&& _checkADX(u.MarketName) <= 25
        //&& _checkCandle(u.MarketName) != '2red'
      );

      for (let i in data.result) {
        let coinRes = data.result[i];
        const listcoin = new ListCoinBittrexSideWay({
          marketNn: coinRes.MarketName,
          volume: coinRes.BaseVolume,
          spread: '',//_spread(coinRes.Last, coinRes.Ask, coinRes.Bid),
          trend: ''//_checkTrend(coinRes.MarketName),
          //adx: _checkADX(coinRes.MarketName)
        });

        listcoin.save(function (error) {
          if (error) {
            console.error(error);
          }
        });
      }
    });
  })
    .catch((err) => {
      return next(err);
    });


}

const deleteListCoinBeforeScan = async () => {
  await
    ListCoinBittrexSideWay.remove({}, (err, data) => {
      if (err) {
        return next(err);
      }
      return data;
    });
  return true;
}

function _spread(bittrexlast, bittrexask, bittrexbid) {
  return (100 / bittrexlast) * (bittrexask - bittrexbid);
}

const _checkTrend = async (marketNm) => {
  let count_up = 0;
  let count_down = 0;
  await
    bittrex.getcandles({
      marketName: marketNm,
      tickInterval: 'thirtyMin'
    }, function (data, err) {
      if (err) {
        return console.error(err);
      }

      let coinArr = data.result;
      let newArrCoin = coinArr.slice((coinArr.length - 20), coinArr.length);

      newArrCoin.forEach(function (price) {
        {
          if (price.C > price.O) {
            count_up = count_up + 1;
          }
          if (price.C < price.O) {
            count_down = count_down + 1;
          }
        }
      });
    });

  if (count_up > count_down) {
    return "up";
  } else if (count_up < count_down) {
    return "down";
  } else {
    return "sideway";
  }
}


function _checkCandle(marketNm) {

  //let CC = setTimeout(function () {
  let countred = 0;
  bittrex.getcandles({
    marketName: marketNm,
    tickInterval: 'thirtyMin'
  }, function (data, err) {
    if (err) {
      return console.error(err);
    }
    let coinArr = data.result;
    let last3candle = coinArr.slice((coinArr.length - 4), coinArr.length - 1);
    last3candle.forEach(function (price) {
      {
        if (price.C < price.O) {
          countred = countred + 1;
        }
      }
    });
    //return countred;
  });
  //}, 500);
  //console.log(countred);
  if (countred === 2) {
    return "2red";
  } else {
    return "1red";
  }
}


const _checkADX = async (close, high, low) => {
  let period = 14;
  let input = {
    close: close,
    high: high,
    low: low,
    period: period
  }
  let lastADX = await _.last(ADX.calculate(input));
  return lastADX.adx;
}

/**
 *
 * @param req
 * @param res
 */
exports.getReqWithdrawnList = (req, res) => {
  let p0 = new Promise((resolve, reject) => {
    ListCoinTopBittrex.find({activeFlag: 'Y'}, (err, listCoin) => {
      if (err) {
        reject(err);
      } else {
        resolve(listCoin);
      }
    });
  });

  let p1 = new Promise((resolve, reject) => {
    ListCoinTopBittrex.find({}, (err, listCoin) => {
      if (err) {
        reject(err);
      } else {
        resolve(listCoin);
      }
    });
  });

  let p2 = new Promise((resolve, reject) => {
    ListCoinBuySellBittrex.find({}, (err, listBuySell) => {
      if (err) {
        reject(err);
      } else {
        resolve(listBuySell);
      }
    });
  });

  Promise.all([p0, p1, p2])
    .then((data) => {
      res.render('account/listCoin', {
        title: 'List Coin',
        listCoinActive: data[0],
        listCoin: data[1],
        listBuySell: data[2],
      });
    })
    .catch((err) => {
      return next(err);
    });
};

/**
 * Get List Coin Sideway
 * @param req
 * @param res
 */
exports.getListCoinSideWay = (req, res) => {
  // // getListCoin().then((data) => {
  // //
  // // })
  // //   .catch((err) => {
  // //     return next(err);
  // //   });
  // let p0 = new Promise((resolve, reject) => {
  //   ListCoinBittrexSideWay.find({}, (err, listCoin) => {
  //     if (err) {
  //       reject(err);
  //     } else {
  //       resolve(listCoin);
  //     }
  //   });
  // });
  // Promise.all([p0])
  //   .then((data) => {
  //     res.render('account/listCoinSideWay', {
  //       title: 'List Coin',
  //       listCoin: data[0]
  //
  //     });
  //   })
  //   .catch((err) => {
  //     return next(err);
  //   });

  bittrex.getmarketsummaries(function (data, err) {
    if (err) {
      return console.error(err);
    }
    //Chỉ get cặp BTC va volume > 500
    data.result = _.filter(
      data.result, u => u.MarketName.toString().indexOf('BTC-') > -1
        && u.BaseVolume > 500
        //&& _spread(u.Last, u.Ask, u.Bid) > 0.2
        && _checkTrend(u.MarketName) != 'up'
      //&& _checkADX(u.MarketName) <= 25
      //&& _checkCandle(u.MarketName) != '2red'
    );

    res.render('account/listCoinSideWay', {
            title: 'List Coin',
            listCoin: data.result

          });
  });
}

function getPerWL(coinNm, timeenterPrice, enterPrice) {
  let winLosePrice = 0;
  return new Promise((resolve, reject) => {
    binance.candlesticks(coinNm, "15m", (error, ticks, symbol) => {
      if (error) {
        reject(error);
      }
      //console.log("candlesticks()", ticks);
      ticks.forEach(item => {
        if (enterPrice <= Number(item[4])) {
          winLosePrice = Number(item[4]);
          return;
        }
      });

      let last_tick = ticks[ticks.length - 1];
      let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
      if (winLosePrice === 0) {
        winLosePrice = close;
      }
      let wlPr = ((Number(winLosePrice) - enterPrice) / enterPrice * 100).toFixed(2);
      resolve(wlPr);
    }, {startTime: timeenterPrice, endTime: timeenterPrice + 4500000});
  })
}

exports.removeCheck = (req, res) => {
  const reqCode = req.query.code;
  ListCoinTopBittrex.update({marketNn: reqCode}, {
    $set: {
      activeFlag: 'N',
      buyFlag: 'N'
    }
  }, (err, reqBtc) => {
    if (err) {
      req.flash('errors', err);
      return res.redirect('/listCoin');
    } else {
      return res.redirect('/listCoin');
    }
  });
};






