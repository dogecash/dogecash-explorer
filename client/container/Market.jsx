
import Actions from '../core/Actions';
import Component from '../core/Component';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import numeral from 'numeral';
import PropTypes from 'prop-types';
import React from 'react';

import HorizontalRule from '../component/HorizontalRule';
import Table from '../component/Table';
var blacklistval = "";
var orderdata = [];
class Market extends Component {
  static defaultProps = {
    coin: {}
  };

  static propTypes = {
    coin: PropTypes.object.isRequired,
    getOrderBookCryptoBridge: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      cols: [
        { key: 'price', title: 'BTC' },
        { key: 'quantity', title: 'DOGEC' },      ],
      orderbookasks:[],orderbookbids:[]
    };
  };
  async getOrderBook(pair) {
    let [quote, base] = pair.split('/');
    quote = this.staticPairs.indexOf(quote) === -1 ? `BRIDGE.${quote}` : quote;
    base = this.staticPairs.indexOf(base) === -1 ? `BRIDGE.${base}` : base;
    return this.connected.then(async () => {
      const [baseId, basePres] = await BitShares.assets[base].then(r => [r.id, r.precision]);
      const [quoteId, quotePres] = await BitShares.assets[quote].then(r => [r.id, r.precision]);
      const data = await BitShares.db.get_limit_orders(baseId, quoteId, 300);
      const asks = {};
      const bids = {};
      const result = {
        bids: [],
        asks: [],
        type: 'snapshot',
        exchange: 'cryptobridge',
        symbol: pair
      };
      data.forEach(el => {
        if (el.sell_price.base.asset_id === baseId) {
          let price =
            el.sell_price.base.amount / el.sell_price.quote.amount / 10 ** (basePres - quotePres);
          price = +price.toFixed(8);
          const volume = el.sell_price.quote.amount / 10 ** quotePres;
          if (Object.prototype.hasOwnProperty.call(bids, price)) {
            bids[price] += volume;
          } else {
            bids[price] = volume;
          }
        } else {
          let price =
            el.sell_price.quote.amount / el.sell_price.base.amount / 10 ** (basePres - quotePres);
          price = +price.toFixed(8);
          const volume = el.sell_price.base.amount / 10 ** quotePres;
          if (Object.prototype.hasOwnProperty.call(asks, price)) {
            asks[price] += volume;
          } else {
            asks[price] = volume;
          }
        }
      });
      result.asks = Object.keys(asks)
        .sort((a, b) => +a - +b)
        .map(price => [+price, asks[price]]);
      result.bids = Object.keys(bids)
        .sort((a, b) => +b - +a)
        .map(price => [+price, bids[price]]);
      return result;
    });
  }

  async componentDidMount() {

  //  this.props.getOrderBookCryptoBridge().then(orderbookasks => this.setState({ orderbookasks }));

    
  
   const data = await getOrderBook("DOGEC/BTC");

  
   //  await BitShares.disconnect()
  
    this.setState({ orderbookasks: data.asks });
    this.setState({ orderbookbids: data.bids });

        console.log(this.state.orderbookasks)
  };


  render() {

    return (
        <div>
      <div>
        <HorizontalRule title="Sell Orders" />
        <Table
          cols={ this.state.cols }
          data={ this.state.orderbookasks.map((order, idx) => ({
            
            ...order,
            price: order.price,
            quantity: order.quote ,
          })) } />
      </div>
         <div>
         <HorizontalRule title="Buy Orders" />
         <Table
           cols={ this.state.cols }
           data={ this.state.orderbookbids.map((order, idx) => ({
             
             ...order,
             price: order.price,
             quantity: order.quote ,
           })) } />
       </div>
       </div>
    );
  };
}

const mapDispatch = dispatch => ({
    getOrderBookCryptoBridge: () => Actions.getOrderBookCryptoBridge()
});

const mapState = state => ({
  coin: state.coin
});

export default connect(mapState, mapDispatch)(Market);
