export class ErrorModel {
    /**
     * unique error code
     * @type {string}
     * @memberof ErrorModel
     */
    public code?: string;
    /**
     * status code
     * @type {number}
     * @memberof ErrorModel
     */
    public status?: number;
    /**
     * additional data
     * @type {*}
     * @memberof ErrorModel
     */
    public metaData?: any;
}