# Market Order Book Backend

This project implements a basic market order book system using **Node.js**, **Express.js**, and **body-parser**. It allows users to place **buy** and **sell** orders for a specific asset (GOOGLE stock in this case) and manages the order book for these transactions. It also provides APIs to view the order depth, user balances, and a price quote for the asset.

## Features

1. **Users and Balances**: 
    - Each user has a unique ID and a balance of assets (GOOGLE stock and USD).
    - The initial balances for two users are hardcoded in the `users` array.

2. **Order Types**:
    - The system supports **bid** (buy) and **ask** (sell) orders.
    - The order book is divided into **bids** (buy orders) and **asks** (sell orders).

3. **Order Matching**:
    - Orders are processed through the `fillOrder()` function, which matches incoming orders with existing ones.
    - Orders are filled if the bid price is greater than or equal to the ask price.
    - If there is no matching order, the remaining order quantity is added to the order book.

4. **Balance Flipping**:
    - After an order is matched, the system updates user balances using the `flipBalance()` function. It transfers the asset (GOOGLE stock) from the seller to the buyer and USD from the buyer to the seller.

5. **API Endpoints**:
    - `/order`: Allows users to place a new buy or sell order.
    - `/depth`: Displays the current order book depth for both bids and asks.
    - `/balance/:userId`: Retrieves the balance of the specified user (GOOGLE stock and USD).
    - `/quote`: Provides an average price quote for the asset based on current ask prices.
