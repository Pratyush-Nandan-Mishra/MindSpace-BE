import User from "../models/User.js";
import LLMCall from "../models/LLMCall.js";
import Billing from "../models/Billing.js";

export const statsController = async (req, res, next) => {
    try {
        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).then(arr => arr.map(u => ({
            date: u._id, count: u.count
        })));

        const dau = await User.aggregate([
            {
                $match: {
                    lastActive: {
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$lastActive"
                        }
                    },
                    activeUsers: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).then(arr => arr.map(u => ({
            date: u._id, activeUsers: u.activeUsers
        })));

        const mau = await User.aggregate([
            {
                $match: {
                    lastActive: {
                        $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$lastActive"
                        }
                    },
                    activeUsers: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]).then(arr => arr.map(u => ({
            month: u._id,
            activeUsers: u.activeUsers
        })));

        const llmCalls = await LLMCall.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString:
                        {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    calls: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).then(arr => arr.map(c => ({
            date: c._id,
            calls: c.calls
        })));

        const billings = await awaitBilling.aggregate([
            {
                $group: {
                    _id: "$type",
                    amount: { $sum: "$amount" }
                }
            }
        ]).then(arr => arr.map(b => ({
            type: b._id,
            amount: b.amount
        })));

        res.json({
            success: true,
            stats: { userGrowth, dau, mau, llmCalls, billings }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}