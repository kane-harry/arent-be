export const unixTimestampToDate = (unixTimestamp: any) => {
    return new Date(unixTimestamp * 1000);
}