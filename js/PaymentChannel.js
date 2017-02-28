'use strict';

var Insight = require('bitcore-explorers-dash').Insight;
var bitcore = require('bitcore-lib-dash');
var paymentChannel = require('bitcore-channel-dash');
var PrivateKey = bitcore.PrivateKey;
var Consumer = paymentChannel.Consumer;
var Provider = paymentChannel.Provider;
var Commitment = paymentChannel.Transactions.Commitment;

var commitmentKey = null;
var providerKey = null;
var network = 'testnet';
var socket=null;
var messageFromProvider;
var commitmentTx;
var providerPublicKey;
var signedRefund;

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

    window.createPaymentChannel = function() {
        var self = this;

        this.providerPublicKey = this.provider.getPublicKey();

        console.log('funding private key: ' + this.refundKey.toString());
        console.log('refund private key: ' + this.fundingKey.toString());
        console.log('commitment private key: ' + this.commitmentKey.toString());
        console.log('provider private key: ' + this.providerKey.toString());
        console.log('provider getPublicKey: ' + this.provider.getPublicKey());
        console.log('provider payment address: ' + this.provider.paymentAddress.toString());

        // if using testnet be careful not to forget to construct consumer with the network option, otherwise there will be a mismatch of addresses validating the refund Tx (in consumer.js Consumer.prototype.validateRefund)
        this.consumer = new Consumer({
            fundingKey: this.fundingKey,
            refundKey: this.refundKey,
            refundAddress: this.refundKey.toAddress(),
            commitmentKey: this.commitmentKey,
            providerPublicKey: this.providerPublicKey,
            providerAddress: this.provider.paymentAddress,
            network: network
        });

        var demoText = 'Now that both provider and consumer are set up and we have instantiated our consumer object, we have two ways of funding the channel. The basic one is to send DASH to an address that is provided by the Consumer instance (a private key had been created for this purpose in Step 0. prepare Consumer).';
        demoText = demoText + '\n' + 'To continue, send any amount of tDASH to ' + this.consumer.fundingAddress.toString() + ' to fund the channel';
        $('#demoText').text(demoText + '\n');
        console.info(demoText);

        self.initSocket(this.consumer.fundingAddress.toString())

        return true;

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
        console.log('provider private key: ' + this.providerKey.toString());


        //create provider
        //console.log('this.paymentAddress: ' + this.paymentAddress);



        this.provider = new Provider({
            network: network
        });

        var paymentAddress = this.provider.getPublicKey().toAddress(this.network);
        this.provider.paymentAddress = paymentAddress;
        console.log('provider payment address: ' + paymentAddress);


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


        var demoText = 'The refund transaction has been signed by the merchant and sent back to the consumer.';
        demoText = demoText + '\n' + 'The consumer should now verify the signed refund Tx from the merchant, before starting to make the first payment';
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


        if (consumer.validateRefund(this.signedRefund.toJSON())) {
            var demoText = 'Signed refund message successfully validated.' + '\n' + consumer.refundTx.toJSON().outputs[0].script + '\n';
            var demoText = demoText + 'Now consumer can broadcast commitment and start sending payments...';
            console.log(demoText);
            $('#demoText').text(demoText + '\n');

            var insight = new Insight(self.socketurl, this.network);

            insight.broadcast(consumer.commitmentTx, function(err, txid) {
                if (err) {
                    console.log('Error broadcasting');
                } else {
                    console.log('commitment Tx ' + consumer.commitmentTx);
                    console.log('broadcasted as' + txid);
                    $('#text-broadcast-commitment').text(consumer.commitmentTx + '\n');
                    $('#text-broadcast-commitment').append('broadcasted as', txid);
                }
            });



        } else {
            console.log('refund validation error');
        }

    };


    window.pay = function(duffs) {
        var self = this;
        var consumer = self.consumer;

        console.log('increment payment with ' + duffs + ' duffs');

        if(consumer.commitmentTx.isFullySigned()) {

            console.log('consumer.refundTx.toJSON(): '+consumer.refundTx.toJSON());
            var refund = consumer.refundTx.toJSON();
            console.log('refund.outputs[0].script: '+refund.outputs[0].script);
            $('#text-pay').text('Refund tx has already been validated before sending commitment, so no need to validate another time.' + '\n');

            consumer.incrementPaymentBy(duffs);

            console.log(consumer.paymentTx.toString());

            var demoText = 'Sent payment of ' + duffs + ' duffs';
            console.log(demoText);
            $('#demoText').text(demoText + '\n');
            $('#text-pay').append(demoText + '\n');
            $('#text-pay').append('raw tx:' + '\n');
            $('#text-pay').append(consumer.paymentTx.toString() + '\n');
            $('#text-pay').append('amount: ' + consumer.paymentTx.amount + '\n');
            $('#text-pay').append('sequence: ' + consumer.paymentTx.sequence + '\n');
            $('#text-pay').append('total paid: ' + consumer.paymentTx.paid + '\n');

            demoText = 'Upon receipt of payment the merchant should check the payment.';
            $('#demoText').text(demoText + '\n');


        } else {
            console.log('commitment Tx not fully signed');
        }

    };

    window.checkLastPayment = function () {
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

        var payment = consumer.paymentTx.toString();
        console.log('payment: ' + payment.toString());

        payment = provider.validPayment(consumer.paymentTx.toObject());
        console.log('validated payment: ' + payment.toString());
        $('#text-check-payment').text('validated payment: ' + payment.toString() + '\n');

    };

    window.broadcastPayment = function () {
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

        var payment;

        if (!provider.paymentTx===undefined){
            if (provider.paymentTx.isFullySigned()) {
                console.log('paymentTx fully signed.');
                $('#text-broadcasting-payment').append('paymentTx fully signed.' + '\n');
                payment = provider.paymentTx;
            } else {
                console.log('paymentTx not yet signed by provider. Validating and signing...');
                $('#text-broadcasting-payment').append('paymentTx not yet signed by provider. Validating and signing...' + '\n');
                payment = consumer.paymentTx.toString();
                payment = provider.validPayment(consumer.paymentTx.toObject());
            }
        } else {
            console.log('paymentTx not yet signed by provider. Validating and signing...');
            $('#text-broadcasting-payment').append('paymentTx not yet signed by provider. Validating and signing...' + '\n');
            payment = consumer.paymentTx.toString();
            payment = provider.validPayment(consumer.paymentTx.toObject());
        }

        console.log('broadcasting payment: ' + payment.toString());
        $('#text-broadcasting-payment').text('broadcasting payment: ' + '\n' + payment.toString() + '\n');


        var insight = new Insight(this.socketurl, this.network);

        insight.broadcast(payment.toString(), function(err, txid) {
            if (err) {
                console.log('Error broadcasting');
            } else {
                console.log('payment broadcasted as', txid);
            }
        });

    };


    window.refundUnusedFunds = function() {

        var ret = false;
        var refundKey = this.refundKey;
        console.log('Refund key: ' + refundKey);

        var insight = new Insight(this.socketurl, this.network);

        insight.getUtxos(refundKey.toAddress(), function(err, utxo) {
            var tx = new bitcore.Transaction()
                .from(utxo)
                .change(fundingKey.toAddress())
                .sign(refundKey)
                .serialize();
            $('#text-resend').append('refund tx: ' + tx + '\n');
            insight.broadcast(tx, function(err, txid) {
                if (err) {
                    console.log('Error broadcasting');
                } else {
                    console.log('unused funds tx broadcasted as', txid);
                    $('#text-resend').append('unused funds tx broadcasted with txid: ' + txid + '\n');
                    ret = true;
                }
            });
        });

        return ret;
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

        console.log('trying to connect to ' + socketurl + '...' );

        socket.on('connect', function() {
            //socket.emit('subscribe', 'txlock');
            socket.emit('subscribe', 'bitcoind/addresstxid', [ address ]);
        });



        socket.on('bitcoind/addresstxid', function(data) {
            var consumer = self.consumer;

                console.log('addresstxid: '+ data.txid);
                console.log('address: '+ data.address);

                // now poll for transaction

                var txid = data.txid;

                var insight = new Insight('http://195.141.143.51:3001', 'testnet');

                console.log('consumer.fundingAddress: '+consumer.fundingAddress);

                insight.getUtxos(consumer.fundingAddress, function(err, utxos) {

                    if(err) {
                        console.log("err: " + err.toString());
                        return false;
                    }

                    console.log('utxos: '+ utxos);

                    consumer.processFunding(utxos);
                    consumer.commitmentTx._updateChangeOutput();

                    // messageToProvider with refund transaction should be sent to provider to sign
                    var messageToProvider = consumer.setupRefund().toJSON();
                    console.log('unsigned refund: ' + consumer.setupRefund().toString());
                    console.log('commitment: ' + consumer.commitmentTx.toString());
                    $('#text-unsigned-refund').text(consumer.setupRefund().toString());
                    $('#text-commitment').text(consumer.commitmentTx.toString());

                    var demoText = 'This channel has been funded and a refund transaction automatically generated.';
                    demoText = demoText + '\n' + 'This unsigned refund transaction is now sent to the merchant, who needs to sign it.';
                    demoText = demoText + '\n' + 'This allows for any unused funds to be reclaimed by the consumer without recourse to the merchant should the channel be interrupted.';
                    $('#demoText').text(demoText + '\n');
                    console.info(demoText);
                    socket.removeAllListeners("bitcoind/addresstxid");
                    jQuery('#btn-refund').prop('disabled', false);
                    return false; // inactive socket status

                });

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


    window._fetch = function(opts,cb) {
        var self = this;
        console.log("data: "+JSON.stringify(opts.data));
        if(opts.type && opts.route && opts.data) {
            console.log('requesting ' + socketurl + opts.route);
            jQuery.ajax({
                type: opts.type,
                url: socketurl + opts.route,
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




