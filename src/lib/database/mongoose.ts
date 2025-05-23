//数据库连接模块，单例模式
//引入mongoose模块，mongoose是一个MongoDB对象建模工具，提供了一个在Node.js环境中使用MongoDB的方式
//思路是：
//1.建立连接缓存机制，避免重复连接数据库，通过cached变量来存储连接实例和连接状态,也就是缓存
//2.如果连接实例（缓存）已经存在，就直接返回这个实例
//3.如果连接实例不存在，就创建一个新的连接实例
//4.异步操作

import mongoose, { Mongoose } from 'mongoose';  //

const MONGODB_URL = process.env.MONGODB_URL;

//定义一个接口，管理数据库连接
interface MongooseConnection {
    conn: Mongoose | null;   //存储连接实例
    promise: Promise<Mongoose> | null;  //存储连接状态
}

// 从全局获取连接实例mongoose，并存储到变量cached中
// cached变量被声明为MongooseConnection类型
let cached: MongooseConnection = (global as any).mongoose;  

//判断是否已经存在连接，如果cached的值为假，说明没有连接，则初始化cached变量并赋予空值
if(!cached) {
    cached = (global as any).mongoose = {
        conn: null, promise: null
    }
}

//连接数据库的函数
//async表示这个函数是异步的，返回一个Promise对象
//await表示等待Promise对象的结果，直到Promise对象的状态改变为resolved或rejected
export const connectToDatabase = async () => {

    //如果cached变量中有连接实例，说明已经连接过数据库了，就直接返回这个连接实例，这样就避免了重复连接数据库
    if(cached.conn) return cached.conn;

    //查找是否有连接URL，没有就抛出一个错误
    if(!MONGODB_URL) throw new Error('Missing MONGODB_URL');

  
    //上面的if语句如果不成立，说明没有连接实例，就往下执行
    //如果cached.promise为真，说明连接状态已经存在了，有可能还没连接成功，直接返回这个连接状态
    //否则就创建一个新的连接状态，promise是一个承诺，可能会在未来的某个时间点被解决或拒绝
    cached.promise = 
        cached.promise || 
        mongoose.connect(MONGODB_URL, {
            dbName: 'imgai',
            bufferCommands: false
        });

    cached.conn = await cached.promise;  //等待连接状态的结果，连接成功后将连接实例存储在cached变量中

    return cached.conn;

}