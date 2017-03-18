export default () => {
    const host = 'timolawl-stocks.herokuapp.com';
    if ((host == location.host) && (location.protocol != 'https:'))
        location.protocol = 'https';
}
