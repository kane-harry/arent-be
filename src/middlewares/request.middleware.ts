import { Request, Response, NextFunction } from 'express';

export interface CustomRequest extends Request {
    agent?: any;
    body: any;
    params: any;
    query: any;
}

const requestMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
    req.query.pageindex = Number(req.query.pageindex || 1);
    req.query.pagesize = Number(req.query.pageindex || process.env.DEFAULT_QUERY_PAGE_SIZE);
    req.agent = req.headers['user-agent']
    next();
}

export default requestMiddleware;