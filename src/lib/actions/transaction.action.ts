// 创建Stripe交易与数据库的连接

"use server";

import  Stripe from "stripe"; 
import { redirect } from "next/navigation";   
import { handleError } from "../utils";
import { connectToDatabase } from "../database/mongoose";
import Transaction from "../database/models/transaction.model";
import { updateCredits } from "./user.actions";

// 处理支付
export async function checkoutCredits(transaction: CheckoutTransactionParams) {

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);    // 创建一个Stripe实例

    const amount = Number(transaction.amount) * 100;  // 获取交易金额
    
    // 创建一个交易会话
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {                 // 设置价格数据
                    currency: "usd",
                    unit_amount: amount,
                    product_data: {
                        name: transaction.plan
                    }
                },
                quantity: 1    // 设置数量
            }
        ],
        metadata:{             // 设置订单元数据
            plan: transaction.plan,
            credits: transaction.credits,
            buyerId: transaction.buyerId,
        },
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
        cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/`,
    })

    redirect(session.url!)
    
}
    
// 在数据库中创建一个交易记录，更新用户积分
export async function creatTransaction(transaction:CreateTransactionParams) {
    try {
        await connectToDatabase();

        const newTransaction = await Transaction.create({        // 在数据库中创建一个交易
            ...transaction, buyer: transaction.buyerId
        });

        await updateCredits(transaction.buyerId, transaction.credits)   // 更新用户积分

        return JSON.parse(JSON.stringify(newTransaction));  
    } catch (error) {
        handleError(error);
    }
}