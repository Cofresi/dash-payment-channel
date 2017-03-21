'use strict';

var Insight = require('bitcore-explorers-dash').Insight;
var bitcore = require('bitcore-lib-dash');
var paymentChannel = require('bitcore-channel-dash');
var PrivateKey = bitcore.PrivateKey;
var Consumer = paymentChannel.Consumer;
var Provider = paymentChannel.Provider;
var Commitment = paymentChannel.Transactions.Commitment;
var Refund = paymentChannel.Transactions.Refund;
var Mnemonic = require('bitcore-mnemonic-dash');
var HDprivKey = bitcore.HDPrivateKey
var HDpubKey = bitcore.HDPublicKey
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
        var code;

        if (this.network === 'testnet') {

            code = new Mnemonic($('#consumer_mnemonic').val());
            console.log("mnemonic:" + code.toString());
            var xpriv = code.toHDPrivateKey('', this.network);
            console.log("xpriv:" + xpriv);
            var derived = xpriv.derive("m/44'/1'/0'");
            //var derived2 = xpriv.derive("m/44'/0'");
            //var derived3 = xpriv.derive("m/44'");
            console.log("derived:" + derived);
            //console.log("derived2:" + derived);
            //console.log("derived3:" + derived);

            // obtain derived HDPublicKey
            var hdPublicKey = derived.hdPublicKey;
            console.log("hdPublicKey:" + hdPublicKey);
            $('#xpub_consumer').text(hdPublicKey);

            var privateKey = derived.toJSON().privateKey;
            console.log("consumer privateKey:" + privateKey);


            this.refundKey = new bitcore.PrivateKey(privateKey);
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

        $('#text-consumer').text('refund key: ' + this.refundKey.toString() + '\n' + 'funding key: ' + this.fundingKey.toString() + '\n' + 'commitment key: ' + this.commitmentKey.toString() + '\n');
        console.log('refund private key: ' + this.refundKey.toString());
        console.log('funding private key: ' + this.fundingKey.toString());
        console.log('commitment private key: ' + this.commitmentKey.toString());
        var demoText = 'The private keys for the Consumer object have been created.' + '\n';
        demoText = demoText + "They will generate the public addresses for the funding and the commitment (contract) transactions." + '\n';
        demoText = demoText + "We also have a final address that we'll use as a 'change' address (sending here any funds that we didn't transact with the Provider). We'll call this the 'refund' address, as it will also be the address where the refund will get to in case the contract is cancelled." + '\n';
        demoText = demoText + 'Now prepare the provider (merchant)';


        $('#demoText').text(demoText + '\n');
        return true;

    };

    window.createPaymentChannel = function() {
        var self = this;
        var provider = this.provider;
        var network = this.network;

        this.providerPublicKey = provider.getPublicKey();

        console.log('refund private key: ' + this.refundKey.toString());
        console.log('funding private key: ' + this.fundingKey.toString());
        console.log('commitment private key: ' + this.commitmentKey.toString());
        console.log('provider private key: ' + this.providerKey.toString());
        console.log('provider getPublicKey: ' + this.providerPublicKey);
        console.log('provider payment address: ' + this.provider.paymentAddress.toString());

        // if using testnet be careful not to forget to construct consumer with the network option, otherwise there will be a mismatch of addresses validating the refund Tx (in consumer.js Consumer.prototype.validateRefund)
        this.consumer = new Consumer({
            fundingKey: this.fundingKey,
            refundKey: this.refundKey,
            refundAddress: this.refundKey.toAddress(network),
            commitmentKey: this.commitmentKey,
            providerPublicKey: this.providerPublicKey,
            providerAddress: this.provider.paymentAddress,
            network: network
        });

        var consumer = this.consumer;
        /*
        var insight = new Insight(self.socketurl, this.network);
        insight.getUtxos(this.consumer.fundingAddress, function(err, utxos) {
            //fs.writeFileSync('unsigned.refund.log', consumer.setupRefund().toJSON());
            console.log("consumer.commitmentTx.toString(): " + consumer.commitmentTx.toString());
            //fs.writeFileSync('commitment.log', consumer.commitmentTx.toJSON());
        });
        */

        var demoText = "Note that 'consumer.providerPublicKey' has to be set to 'provider.getPublicKey()' and 'consumer.providerAddress' should be identical to 'provider.paymentAddress'. These two public keys need to be communicated by the provider wallet to the consumer wallet before the Consumer Instance can be created. Now that both provider and consumer are set up and we have instantiated our consumer object, we have to fund the channel. Send DASH to funding address that is created by the Consumer instance (a private key had been created for this purpose in Step 0. prepare Consumer).";
        demoText = demoText + '\n' + 'To continue, send any amount of tDASH to ' + this.consumer.fundingAddress.toString() + ' to fund the channel';
        $('#demoText').text(demoText);
        console.info(demoText);
        $('#paymentaddress').text(this.provider.paymentAddress.toString());
        $('#fundingaddress').text(this.consumer.fundingAddress.toString());

        self.initSocket(consumer.fundingAddress.toString())

        return true;

    };



    window.createProviderKey = function() {
        var self = this;
        var code;
        var privateKey;

        if (this.network === 'testnet') {

            code = new Mnemonic($('#provider_mnemonic').val());
            console.log("mnemonic:" + code.toString());
            var xpriv = code.toHDPrivateKey('', this.network);
            console.log("xpriv:" + xpriv);
            var derived = xpriv.derive("m/44'/1'/0'");
            console.log("derived:" + derived);

            // obtain derived HDPublicKey
            var hdPublicKey = derived.hdPublicKey;
            console.log("hdPublicKey:" + hdPublicKey);
            $('#xpub_provider').text(hdPublicKey);


        }
        else if (this.network === 'mainnet') {
            this.providerKey = new bitcore.PrivateKey(bitcore.Networks.mainnet);
        }
        else {
            console.log('no network set');
            return false;
        }

        this.providerKey = new PrivateKey(derived.toJSON().privateKey);
        var paymentaddress = this.providerKey.toAddress(this.network);
        console.log("paymentaddress: " + paymentaddress);

        $('#text-provider').text('Provider derived private key: ' + this.providerKey.toString() + '\n');
        console.log('provider derived private key: ' + this.providerKey.toString());

        var provider = new Provider({
            network: network,
            paymentAddress: paymentaddress,
            key: this.providerKey
        });

        console.log("key: " + provider.key);
        console.log("getPublicKey: " + provider.getPublicKey());

        this.provider = provider

            console.info('Share this public key with potential consumers: ' + this.provider.getPublicKey());
        $('#text-provider').append('Share this extended public key with the consumer: ' + this.provider.getPublicKey() + '\n');
        $('#text-provider').append('Share the payment address derived from this extended public key with the consumer: ' + paymentaddress + '\n');

        $('#text-consumer').append('extended public key from provider: ' + this.provider.getPublicKey() + '\n');
        $('#text-consumer').append('payment address from provider: ' + paymentaddress + '\n');

        var demoText = 'Once the consumer wallet has received the extended public key and the payment address from the provider, he can then set up a payment channel';
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

        console.log("provider.key: " + provider.key);

        var messageToConsumer = provider.signRefund(consumer.setupRefund().toJSON());
        this.signedRefund = messageToConsumer;
        console.log("signed refund: " + messageToConsumer);
        //this.refundTx = new Refund (provider.signRefund(consumer.setupRefund().toJSON()));

        $('#text-signed-refund').text(messageToConsumer + '\n');
        console.log('messageToConsumer: ' + messageToConsumer);


        var demoText = 'The refund transaction has been signed by the merchant wallet and sent back to the consumer.';
        demoText = demoText + '\n' + 'The consumer wallet should now verify the signed refund Tx from the merchant, before starting to make the first payment';
        $('#demoText').text(demoText + '\n');

        return true;

};


    window.broadcastCommitment = function() {
        var self = this;
        var consumer = self.consumer;

        if(!consumer){
            console.log("consumer not initialised");
            return false;
        }
        var provider = self.provider;
        if(!provider){
            console.log("provider not initialised");
            return false;
        }

        var signedRefund = provider.signRefund(consumer.setupRefund().toJSON());
        console.log("signed Refund: " + signedRefund);
        console.log('signed Refund TX output: ' + signedRefund.outputs[0].script);

        //important: signedRefund must be JSON-serialized otherwise there is an error validating in consumer.js
        if (consumer.validateRefund(signedRefund.toJSON())) {
            var demoText = 'Signed refund message successfully validated.' + '\n';
            var demoText = demoText + 'Now consumer can broadcast commitment and start sending payments...';
            console.log(demoText);
            $('#demoText').text(demoText + '\n');

            var insight = new Insight(self.socketurl, this.network);

            insight.broadcast(consumer.commitmentTx, function(err, txid) {
                if (err) {
                    console.log('Error broadcasting');
                } else {
                    console.log('commitment Tx ' + consumer.commitmentTx);
                    console.log('broadcasted as: ' + txid);
                    var multisigaddr = consumer.commitmentTx.getAddress(self.network).toString();
                    $('#text-broadcast-commitment').text(consumer.commitmentTx + '\n');
                    $('#text-broadcast-commitment').append('broadcasted as txid: ', txid + '\n');
                    $('#text-broadcast-commitment').append('to multisig address: ', multisigaddr + '\n');
                    $('#text-broadcast-commitment').append('outputAmount: ' + consumer.commitmentTx.outputAmount + ' duffs' + '\n');
                    $('#multisig').text(multisigaddr);
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

        if (provider.paymentTx){
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
            console.log('paymentTx not initialized');
        }

        console.log('broadcasting payment: ' + payment.toString());
        $('#text-broadcasting-payment').text('broadcasting payment: ' + '\n' + payment.toString() + '\n');


        var insight = new Insight(this.socketurl, this.network);

        insight.broadcast(payment.toString(), function(err, txid) {
            if (err) {
                console.log('Error broadcasting');
            } else {
                console.log('payment broadcasted as: ', txid);
            }
        });

    };


    window.refundUnusedFunds = function() {
        var self = this;
        var consumer = this.consumer;
        var ret = false;
        var refundKey = this.refundKey;
        console.log('Refund key: ' + refundKey);
        if(!consumer){
            console.log("consumer not initialised");
            return false;
        }
        //console.log("refund address: " + consumer.refundAddress.toString());
        //console.log("refund fee: " + consumer.refundTx.getFee());

        $('#text-resend').append('refund tx: ' + consumer.refundTx.toString() + '\n');

        //var tx = this.refundTx;
        //tx._fee = 10000;
        //tx.serialize(true)
        //console.log('tx.isCoinbase(): ' + tx.isCoinbase());
        //console.log('tx fee: ' + tx.getFee());
        //console.log('tx._estimateFee: ' + tx._estimateFee());

        //this.consumer.refundTx.fee(1000);


        //console.log("consumer.refundTx.to.address: " + consumer.refundTx.to.address);


        var insight = new Insight(this.socketurl, this.network);
        console.log("now broadcasting refund tx");

        insight.getUtxos(consumer.commitmentTx.getAddress(), function(err, utxos) {
            console.log("utxos: " + utxos);
            //tx.from(utxo);

            var tx = new bitcore.Transaction()
                .from(utxos)
                .change(consumer.fundingAddress)
                .sign(consumer.refundKey)
                .serialize(true);

            //console.log("fee: " + tx.getFee());
            console.log("now broadcasting refund tx");
            insight.broadcast(tx, function(err, txid) {
                if (err) {
                    console.log('Error broadcasting');
                } else {
                    console.log('unused funds tx broadcasted as ', txid);
                    $('#text-resend').append('unused funds tx broadcasted with txid: ' + txid + '\n');
                    ret = true;
                }
            });
        });

        /*
        if (tx.hasAllUtxoInfo()) {
            console.log("lacks utxo info");
            insight.getUtxos(consumer.refundAddress.toString(), function(err, utxo) {
                console.log("utxo: " + utxo);
               //tx.from(utxo);

                var tx = new bitcore.Transaction()
                    .from(utxo)
                    .change(consumer.fundingAddress)
                    .sign(consumer.refundKey)
                    .serialize();

                console.log("fee: " + tx.getFee());
                console.log("now broadcasting refund tx");
                insight.broadcast(tx, function(err, txid) {
                    if (err) {
                        console.log('Error broadcasting');
                    } else {
                        console.log('unused funds tx broadcasted as ', txid);
                        $('#text-resend').append('unused funds tx broadcasted with txid: ' + txid + '\n');
                        ret = true;
                    }
                });
            });
        } else {
            console.log("has all utxo info");




            var tx = new bitcore.Transaction()
                .fee(1000)
                .change(fundingKey.toAddress())
                .sign(refundKey)
                .serialize();


            insight.broadcast(tx, function(err, txid) {
                if (err) {
                    console.log('Error broadcasting');
                } else {
                    console.log('unused funds tx broadcasted as ', txid);
                    $('#text-resend').append('unused funds tx broadcasted with txid: ' + txid + '\n');
                    ret = true;
                }
            });


        }
        */

        /*
        insight.getUtxos(tx.getAddress(), function(err, utxo) {
            console.log("utxo: " + utxo);
            tx.from(utxo);
            console.log("fee: " + tx.getFee());
            console.log("now broadcasting refund tx");
            insight.broadcast(tx, function(err, txid) {
                if (err) {
                    console.log('Error broadcasting');
                } else {
                    console.log('unused funds tx broadcasted as ', txid);
                    $('#text-resend').append('unused funds tx broadcasted with txid: ' + txid + '\n');
                    ret = true;
                }
            });
        });
        */

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

                var insight = new Insight('http://155.94.181.166:3001', 'testnet');

                console.log('consumer.fundingAddress: ' + consumer.fundingAddress);

                insight.getUtxos(consumer.fundingAddress, function(err, utxos) {

                    if(err) {
                        console.log("err: " + err.toString());
                        return false;
                    }

                    console.log('utxos: '+ utxos);

                    consumer.processFunding(utxos);
                    consumer.commitmentTx._updateChangeOutput();

                    // messageToProvider with refund TX should be sent to provider to sign
                    var messageToProvider = consumer.setupRefund().toJSON();
                    var refundaddress = consumer.refundAddress.toString();
                    console.log('refundaddress: ' + refundaddress);
                    $('#refundaddress').text(refundaddress);
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
            route: "/api/tx/"+txid,
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




