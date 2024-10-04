import express from 'express';
import bodyParser from 'body-parser';

export const app = express();

app.use(bodyParser.json());

interface Balances{
    [key: string] : number;
}

interface User{
    id: string;
    balances: Balances;
}

interface Order {
    userId: string;
    price: number;
    quantity: number;
}

export const TICKER = 'GOOGLE';

const users : User[] = [{
    id: "1",
    balances: {
        "GOOGLE": 10,
        "USD": 50000 
    }
},
{
    id: "2",
    balances: {
        "GOOGLE": 0,
        "USD": 100000 
    }
}];

const bids: Order[] = [];
const asks: Order[] = [];

app.post('/order', (req : any, res : any) => {
    const side : string = req.body.side; // buy or ask side
    const price : number = req.body.price;
    const quantity : number = req.body.quantity;
    const userId : string = req.body.userId; 

    const remainingQuantity = fillOrder(side, price, quantity, userId);

    if(remainingQuantity === 0){
        res.json({
            filledQuantity: quantity
        });
        return;
    }

    if(side === 'bid'){
        bids.push({
            userId,
            price,
            quantity: remainingQuantity
        });
        bids.sort((a, b) => a.price < b.price ? -1 : 1);
    }
    else{
        asks.push({
            userId, 
            price,
            quantity: remainingQuantity
        });
        asks.sort((a, b) => a.price < b.price ? 1 : -1);
    }

    res.json({
        filledQuantity: quantity - remainingQuantity
    });
})

app.get('/depth', (req : any, res : any) => {
    const depth : {
        [price: string]: {
            type: 'bid' | 'ask',
            quantity: number,
        }
    } = {};

    for(let i = 0; i < bids.length; i++){
        if(!depth[bids[i].price]){
            depth[bids[i].price] = {
                quantity: bids[i].quantity,
                type: 'bid'
            };
        }
        else{
            depth[bids[i].price].quantity += bids[i].quantity; 
        }
    }

    for(let i = 0; i < asks.length; i++){
        if(!depth[asks[i].price]){
            depth[asks[i].price] = {
                quantity: asks[i].quantity,
                type: 'ask'
            };
        }
        else{
            depth[asks[i].price].quantity += asks[i].quantity;
        }
    }

    res.json({
        depth: depth
    });

})

app.get('/balance/:userId', (req : any, res : any) => {
    const userId : string = req.params.userId;
    const user = users.find(u => u.id === userId);

    if(!user){
        return res.json({
            USD: 0,
            [TICKER] : 0
        });
    }
    res.json({
        balances: user.balances
    });
})

app.get('/quote', (req : any, res : any) => {
    //assignments
    let sum = 0;
    for(let i = 0; i< asks.length; i++){
        sum += asks[i].price;
    }

    const avg = sum / asks.length;
    return res.json({
        avg: avg
    });
})

function flipBalance(fromUserId : string, toUserId : string, quantity : number, price : number){
    let user1 = users.find(x => x.id === fromUserId)
    let user2 = users.find(x => x.id === toUserId)

    if( !user1 || !user2 ){
        return;
    }
    user1.balances[TICKER] -= quantity;
    user2.balances[TICKER] += quantity;
    user1.balances["USD"] += (price * quantity);
    user2.balances["USD"] -= (price * quantity);
}

function fillOrder(side: string, price: number, quantity: number, userId: string) : number {
    let remainingQuantity = quantity;
    if(side === 'bid'){
        for(let i = asks.length - 1; i >= 0; i--){
            if(asks[i].price > price){ // if the ask price is higher than the bid price, we can't fill the order
                continue;
            }
            if(asks[i].quantity >= remainingQuantity){ // if the ask quantity is greater than the remaining quantity of the bid, we can partially fill the order 
                asks[i].quantity -= remainingQuantity;
                flipBalance(asks[i].userId, userId, remainingQuantity, asks[i].price);
                return 0;
            }
            else{
                remainingQuantity -= asks[i].quantity;
                flipBalance(asks[i].userId, userId, asks[i].quantity, asks[i].price);
                asks.splice(i, 1);
            }
        }
    }
    else{
        for(let i = bids.length - 1; i >= 0; i--){
            if(bids[i].price < price){
                continue;
            }
            if(bids[i].quantity > remainingQuantity){
                bids[i].quantity -= remainingQuantity;
                flipBalance(userId, bids[i].userId, remainingQuantity, price);
                return 0;
            }
            else{
                remainingQuantity -= bids[i].quantity;
                flipBalance(userId, bids[i].userId, bids[i].quantity, price);
                bids.splice(i, 1);
            }
        }
    }

    return remainingQuantity;
}