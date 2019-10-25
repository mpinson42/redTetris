import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import App from './containers/app.js';
import './index.css'
import { keyTetris } from './actions/server'
// import { storeStateMiddleWare } from './middleware/storeStateMiddleWare'
import reducer from './reducers'
// import { alert } from './actions/alert'

import createSocketIoMiddleware from 'redux-socket.io';
import io from 'socket.io-client';

let socket = io('http://localhost:3004');

const initialState = {
    inputName: "",
    inputNameRoom: "",
    runRoom: false,
    location: "Home",
    master: false,
    socketID: "",
    searchResult: {},
    konami: false
}

socket.on('connect', function () {
    initialState.socketID = socket.id;
})

let socketIoMiddleware = createSocketIoMiddleware(socket, "server/");
// var store = applyMiddleware(socketIoMiddleware)(createStore)(reducer);

export const store = createStore(
    reducer.reducer,
    initialState,
    applyMiddleware(
        thunk,
        socketIoMiddleware,
        createLogger()
    )
)
window.addEventListener('keydown', function (e) {
    keyTetris(e, store.dispatch, store.getState())
})

ReactDOM.render(

    <Provider store={store}><App test='test' /></Provider>,
    document.getElementById('app')
)


// store.dispatch(alert('Soon, will be here a fantastic Tetris ...'))
