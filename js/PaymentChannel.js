'use strict';

var assert = require('assert');
var bitcore = require('bitcore-lib-dash');
var PrivateKey = bitcore.PrivateKey;
var Consumer = require('../../../lib/Consumer');
var Provider = require('../../../lib/Provider');
var Commitment = require('../../../lib/transactions/Commitment');
var consumer = null;
var provider = null;
var refundKey = null;
var fundingKey = null;
var commitmentKey = null;
var providerKey = null;
var network = 'testnet';
var socket=null;
var socketurl="https://dev-test.dash.org:3001";
var insightapi='https://dev-test.dash.org';
var messageFromProvider;
var commitmentTx;
var paymentAddress = 'yMnEpq16VHPPmxnttkD28m6VfdRFdpp8Uq';
var providerPublicKey;
var signedRefund;

//TODO set up package.json to import node.js libs


    window.createPaymentChannel = function() {
        var self = this;

        this.providerPublicKey = this.provider.getPublicKey();

        console.log('funding key: ' + this.refundKey.toString());
        console.log('refund key: ' + this.fundingKey.toString());
        console.log('commitment key: ' + this.commitmentKey.toString());
        console.log('provider key: ' + this.providerKey.toString());
        console.log('provider getPublicKey: ' + this.provider.getPublicKey());


        this.consumer = new Consumer({
            fundingKey: this.fundingKey,
            refundKey: this.refundKey,
            refundAddress: this.refundKey.toAddress(),
            commitmentKey: this.commitmentKey,
            providerPublicKey: this.providerPublicKey,
            providerAddress: this.providerKey.toAddress()
        });

        var demoText = 'Now send DASH to ' + this.consumer.fundingAddress.toString() + ' to fund the channel';
        $('#demoText').text(demoText + '\n');
        console.info(demoText);

        self.initSocket(this.consumer.fundingAddress.toString())

        return true;

    };


window.processFunding = function() {
    var self = this;
    var consumer = this.consumer
    if(!consumer){
        console.log("consumer not initialised");
        return false;
    }

    console.log('get UTXO');
    self.getUTXO(consumer.fundingAddress, function(err, utxos) {

        if(err) {
            console.log("err: " + err.toString());
            return false;
        }

        console.log("utxos: " + utxos);

        console.log("processing funding...");
        consumer.processFunding(utxos);
        consumer.commitmentTx._updateChangeOutput();
        //fs.writeFileSync('unsigned.refund.log', consumer.setupRefund().toJSON());

        //this.refundMessage = consumer.setupRefund().toString();
        console.log("consumer.setupRefund().toString()" + consumer.setupRefund().toString());
        $('#text-unsigned-refund').text(consumer.setupRefund().toString());

        commitmentTx = consumer.commitmentTx.toString();
        console.log("consumer.commitmentTx.toString()" + consumer.commitmentTx.toString());
        $('#text-commitment').text(consumer.commitmentTx.toString());
        //fs.writeFileSync('commitment.log', consumer.commitmentTx.toJSON());


        var messageToProvider = consumer.setupRefund();
        console.log("Refund message for provider to sign: " + messageToProvider);

        var demoText = 'The provider can now sign the refund message';
        $('#demoText').text(demoText + '\n');
        console.info(demoText);
        return true;

    });

};


    window.createProviderKey = function() {
        var self = this;

        if (this.network === 'testnet') {
            this.providerKey = new bitcore.PrivateKey(bitcore.Networks.testnet);
        }
        else if (this.network === 'mainnet') {
            this.providerKey = new bitcore.PrivateKey(bitcore.Networks.mainnet);
        }
        else {
            console.log('no network set');
            return false;
        }

        $('#text-provider').text('provider key: ' + this.providerKey.toString() + '\n');
        console.log('provider key: ' + this.providerKey.toString());


        //create provider

        this.provider = new Provider({
            network: this.network,
            paymentAddress: this.paymentAddress
        });
        console.info('Share this public key with potential consumers: ' + this.provider.getPublicKey());
        $('#text-provider').append('Share this public key with potential consumers: ' + this.provider.getPublicKey() + '\n');


        var demoText = 'Now the consumer can set up a payment channel';
        $('#demoText').text(demoText + '\n');

        return true;

    };

window.signRefund = function() {
    var self = this;

    //var refundMessage = this.refundMessage;
    var provider = this.provider;
    if(!provider){
        console.log("provider not initialised");
        return false;
    }
    var consumer = this.consumer;
    if(!consumer){
        console.log("consumer not initialised");
        return false;
    }

    console.log("consumer.setupRefund().toString()" + consumer.setupRefund().toString());

    var messageToConsumer = provider.signRefund(consumer.setupRefund().toJSON());
    this.signedRefund = messageToConsumer;


    $('#text-signed-refund').text(messageToConsumer + '\n');
    console.log('messageToConsumer: ' + messageToConsumer);

    var demoText = 'Now consumer verify signed refund message';
    $('#demoText').text(demoText + '\n');

    return true;

};


    window.broadcastCommitment = function() {
        var self = this;

        var consumer = this.consumer;
        if(!consumer){
            console.log("consumer not initialised");
            return false;
        }
        var provider = this.provider;
        if(!provider){
            console.log("provider not initialised");
            return false;
        }

        console.log("signed Refund: " + this.signedRefund);
        console.log("provider.signRefund: " + provider.signRefund(consumer.setupRefund().toJSON()));

       // if (consumer.validateRefund(this.signedRefund.toJSON())) {
            var demoText = 'Signed refund message successfully validated. Now consumer can broadcast commitment and start sending payments...';
            console.log(demoText);
            $('#demoText').text(demoText + '\n');

            if (consumer.commitmentTx.isFullySigned()) {

                self.broadcastTx(consumer.commitmentTx.toString(), function (err, txid) {

                    if (err) {
                        console.log("err: " + err.toString());
                        return false;
                    }

                    console.log("commitment txid : " + txid);
                    return true;

                });

            }

     //   } else {
     //       console.log('refund validation error');
     //   }

    };


    window.createConsumerKeys = function() {
        var self = this;

        if (this.network === 'testnet') {
            this.refundKey = new bitcore.PrivateKey(bitcore.Networks.testnet);
            this.fundingKey = new bitcore.PrivateKey(bitcore.Networks.testnet);
            this.commitmentKey = new bitcore.PrivateKey(bitcore.Networks.testnet);
        }
        else if (this.network === 'mainnet') {
            this.refundKey = new bitcore.PrivateKey(bitcore.Networks.mainnet);
            this.fundingKey = new bitcore.PrivateKey(bitcore.Networks.mainnet);
            this.commitmentKey = new bitcore.PrivateKey(bitcore.Networks.mainnet);
        }
        else {
            console.log('no network set');
            return false;
        }

        $('#text-consumer').text('funding key: ' + this.refundKey.toString() + '\n' + 'refund key: ' + this.fundingKey.toString() + '\n' + 'commitment key: ' + this.commitmentKey.toString() + '\n');
        console.log('funding key: ' + this.refundKey.toString());
        console.log('refund key: ' + this.fundingKey.toString());
        console.log('commitment key: ' + this.commitmentKey.toString());
        var demoText = 'Now prepare provider';
        $('#demoText').text(demoText + '\n');
        return true;

    };

window.initSocket = function(address) {
    var self = this;

    this.socket = io(socketurl);
    var socket = this.socket;
    console.log ('socket: ' + socket)


    console.log("-socketio-");
    console.log("listening to: " + address);

    if (address) {
        var address = address;
    } else {
        return false; // inactive socket status
    }

    console.log('trying to connect to ' + this.socketurl + '...' );

    socket.on('connect', function() {
        //socket.emit('subscribe', 'txlock');
        socket.emit('subscribe', 'bitcoind/addresstxid', [ address ]);
    });

/*
    socket.on('txlock', function(data) {
        console.log('txlock: '+ data);

        // TODO - extend bitcoind/addresstxlockid ?

        // or just filter it out to only relate to 'address'

    });
    */

    socket.on('bitcoind/addresstxid', function(data) {
        console.log('addresstxid: '+ data.txid);

        // now poll for transaction

        var txid = data.txid;
        self.processFunding();
        /*
        self.getTx(txid, function(err, res) {

            console.log(res);

            var config = {
                transactionOpts: {
                    confirmations: 1,
                    pendingNotificationInterval: 5,
                    pollingInterval: 2000
                }
            };

            self.verifyTransaction(config.transactionOpts, txid);

        });
        */

    });

    return true; // active socket status
};

window.verifyTransaction = function(opts, txid) {
    var self = this;

    var i = 0;

    transactionPending(opts);

    var refreshId = setInterval( function() {
        console.log('polling...');

        self.getTx(txid, function(err, res) {

            console.log(res);

            var conf = parseInt(res.confirmations);
            var txlock = res.txlock;
            console.log("txlock: " + txlock);

            if (txlock) {
                clearInterval(refreshId);;
            }

            if (conf > 0) {

                if (i < opts.pendingNotificationInterval) {
                    i++;
                } else {

                    // TODO - update eCommerce database with confirmation ?

                    transactionPending(res);
                    i = 0;
                }

                if(res.txlock == 'true') {

                    console.log('txlock detected for txid: ' + res.txid);
                    console.log(res);

                    clearInterval(refreshId);;

                }
                if (res.txid) {

                    if (conf === opts.confirmations) {

                        clearInterval(refreshId);;

                    }

                }

            }


        })


    }, opts.pollingInterval);

};

    window.getUTXO = function(addr, cb) {

        var opts = {
            type: "GET",
            route: "/insight-api-dash/addr/"+addr+"/utxo",
            data: {
                format: "json"
            }
        };

        this._fetch(opts, cb);
    };

    window.getTx = function(txid, cb) {

        var opts = {
            type: "GET",
            route: "/insight-api-dash/tx/"+txid,
            data: {
                format: "json"
            }
        };

        this._fetch(opts, cb);
    };


    window.broadcastTx = function(rawtx, cb) {

        var opts = {
            type: "POST",
            route: "/insight-api-dash/tx/send",
            data: "rawtx="+rawtx
        };

        this._fetch(opts, cb);
    };

    window._fetch = function(opts,cb) {
        var self = this;

        if(opts.type && opts.route && opts.data) {
            console.log('requesting ' + insightapi + opts.route);
            jQuery.ajax({
                type: opts.type,
                url: insightapi + opts.route,
                data: JSON.stringify(opts.data),
                contentType: "application/json; charset=utf-8",
                crossDomain: true,
                dataType: "json",
                success: function (data, status, jqXHR) {
                    cb(null, data);
                },
                error: function (jqXHR, status, error) {
                    var err = eval("(" + jqXHR.responseText + ")");
                    cb(err, null);
                }
            });

        } else {
            cb('missing parameter',null);
        }
    };




