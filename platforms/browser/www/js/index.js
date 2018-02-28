/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


function checkPreAuth() {
    var form = $("#loginForm");
    if(window.localStorage["username"] !== undefined && window.localStorage["password"] !== undefined) {
        $("#username", form).val(window.localStorage["username"]);
        $("#password", form).val(window.localStorage["password"]);
        handleLogin();
    }
}

function changeIcon(domImg,srcImage)
{
    var img = new Image();
    img.onload = function()
    {
        // Load completed
        domImg.src = this.src;
    };
    img.src = srcImage;
}

function getImageForReminderType(type)
{
    switch(type) {
        case ('medication'):
            return 'img/pill-2-xxl.png';
        case ('appointment'):
            return 'img/journal-menu.png';
        case ('weight'):
            return 'img/weight-warning.png';
        case ('heart'):
            return 'img/heart-ok.png';
        case ('steps'):
            return 'img/steps-ok.png';
        default:
            return ""
    }
}

function updateLogo(type, severity)
{
    var logo = document.getElementById("logo");
    switch(type){
        case ('medication'):
            changeIcon(logo, 'img/pill-2-xxl.png');
            break;
        case ('appointment'):
            changeIcon(logo, 'img/journal-menu.png');
            break;
        case ('weight'):
            changeIcon(logo, 'img/weight-warning.png');
            break;
        case ('heart'):
            changeIcon(logo, 'img/heart-ok.png');
            break;
        case ('steps'):
            changeIcon(logo, 'img/steps-ok.png');
            break;
        default:
            return "";
    }
}

function previousReminder()
{
    app.setCurrentReminder(app.currentReminder - 1);
}

function nextReminder()
{
    app.setCurrentReminder(app.currentReminder + 1);
}


function getReminders()
{
    $.ajax({
        url: "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/?user=2",
        dataType: "json",
        type: 'GET',
        success: function (data) {
            var rems = data.objects;
            var cnt = 0;
            var nCnt = 0;
            var remsByDay = {};
            var d = new Date();
            var dateOffset = 30*60*1000;
            d.setTime(d.getTime() - dateOffset);
            app.reminders = [];
            for (var i = 0; i < rems.length; i++) {
                if (!(rems[i].acknowledged === true || rems[i].acknowledged === false)) {
                    var timestamp = rems[i]['timestamp'];
                    var t = new Date(timestamp*1000);
                    var date = moment(t).format('ddd D MMM');
                    if(date in remsByDay)
                    {
                        app.addReminder(remsByDay[date], rems[i]);
                    }
                    else {
                        var dom = document.getElementById('enduser-journal-collection');
                        var dayDom = app.addReminderDay(dom, date);
                        remsByDay[date] = dayDom;
                        app.addReminder(remsByDay[date], rems[i]);
                    }
                    if(t < d)
                    {
                        app.reminders.push(rems[i]);
                    }
                }
            }
            app.addToLatestReminders(app.reminders[0]);

        },
        error: function () {
            alert("Cannot receive reminders. Check your internet connection!");
            $.mobile.navigate("#login-page", { transition : "slide", info: "Login Failed"});
        }

    });
}

function registerNotifications()
{
    window.plugins.PushbotsPlugin.initialize("5a84222e1db2dc56731e6e63", {"android":{"sender_id":"716888555189"}});
    window.plugins.PushbotsPlugin.on("registered", function(token){

    });
    window.plugins.PushbotsPlugin.on("user:ids", function(data){
        var token = data['token'];
        var userId = data['userId'];
        var camiUserId = app.user['resource_uri'];
        window.plugins.PushbotsPlugin.updateAlias(camiUserId);
        $.ajax({
            url: "http://cami.vitaminsoftware.com:8008/api/v1/pushnotificationdevice/",
            type: 'POST',
            beforeSend: function(request) {
                request.setRequestHeader("Content-Type", 'application/json');
            },
            dataType: 'json',
            data: JSON.stringify({
                registration_id: camiUserId,
                type: "GCM",
                user: camiUserId,
                other_info: "{}"
            }),
            success: function( data, textStatus, jQxhr ){
            },
            error: function( jqXhr, textStatus, errorThrown ){
                Materialize.toast("CAMI ERROR::" + JSON.stringify(jqXhr), 4000, 'rounded');// 4000 is the duration of the toast
            }
        });
    });
}

function handleLogin() {
    var form = $("#loginForm");
    //disable the button so we can't resubmit while we wait
    var u = $("#username", form).val();
    var p = $("#password", form).val();

    if(u !== '' && p !== '')
    {
        if (p !== 'imac') {
            Materialize.toast('Login Failed!', 1000, 'rounded');// 4000 is the duration of the toast
        } else {
            $.getJSON("http://cami.vitaminsoftware.com:8008/api/v1/user/?username=" + u,
                function (userJson) {
                    var users = userJson['users'];
                    if(users && users.length > 0)
                    {
                        app.user = users[0];
                        var profile = users[0]['enduser_profile'];

                        if(profile)
                        {
                            var account_role = profile['account_role'];
                            if(account_role === 'end_user')
                            {
                                //registerNotifications();
                                $.mobile.navigate("#enduser-page", { transition : "slide"});
                            }
                        }
                        else {
                            profile = users[0]['caregiver_profile'];
                            if(profile)
                            {
                                var account_role = profile['account_role'];
                                if(account_role === 'caregiver')
                                {
                                    //registerNotifications();
                                    $.mobile.navigate("#caregiver-page", { transition : "slide"});
                                }
                            }
                            else {
                                Materialize.toast('Login Failed!', 1000, 'rounded');// 4000 is the duration of the toast
                                $.mobile.navigate("#login-page", { transition : "slide", info: "Login Failed"});
                            }
                        }
                    }
                    else {
                        Materialize.toast('Login Failed!', 1000, 'rounded');// 4000 is the duration of the toast
                        $.mobile.navigate("#login-page", { transition : "slide", info: "Login Failed"});
                    }
                }).error(
                    function() {
                        Materialize.toast('Login Failed!', 1000, 'rounded');// 4000 is the duration of the toast
                        $.mobile.navigate("#login-page", { transition : "slide", info: "Login Failed"});
                    }
                );

        }


        /*
        if(u === 'catalin' && p === 'imac') {
            window.localStorage["username"] = u;
            window.localStorage["password"] = p;
            $.mobile.navigate("#first-page", { transition : "slide"});
        }
        else if(u === 'andrei' && p === 'cami')
        {
            window.localStorage["username"] = u;
            window.localStorage["password"] = p;
            $.mobile.navigate("#second-page", { transition : "slide"});
        }
        else {
            navigator.notification.alert("Your login failed", function() {});
        }
        */
    }
    else {
        Materialize.toast('You must enter a username and password!', 4000, 'rounded');// 4000 is the duration of the toast

    }
    return false;
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
}

var app = {
    SOME_CONSTANTS : false,  // some constant
    user: {},
    reminders: [],
    currentReminder: -1,
    addReminderDay: function(dom, day)
    {
        var content = '<div class="roundedCard w3-container w3-border w3-round-xlarge">' +
        '<div class="row enduser-journal-dateholder">' +
        '<div class="col-3">' +
        '<hr class="line">' +
        '</div>' +
        '<div class="col-6 date-holder">' +
        '<p class="date-p">'+ day + '</p>' +
        '</div>' +
        '<div class="col-3">' +
        '<hr class="line">' +
        '</div>' +
        '</div>';
        var dayDom = createElementFromHTML(content);
        dom.appendChild(dayDom);
        return dayDom;
    },
    addReminder: function(dom, reminder)
    {

        var timestamp = reminder['timestamp'];
        var t = new Date(timestamp*1000);
        var formatted = ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2);

        var content = '<li>' +
            '<div class="col s12 m7">' +
            '<div class="row vertical-divider w3-container w3-border w3-round-xlarge">' +
            '<div class="col-3">' +
            '<br>' +
            '<img class="card-type-image" src="' + getImageForReminderType(reminder['type']) + '">' +
            '<p class="card-time">'+formatted+'</p>' +
            '</div>' +
            '<div class="' + reminder['severity'] +' col-9">' +
            '<br>' +
            '<div>' +
            '<p class="card-time">'+ reminder['description'] + '</p>' +
            '</div>' +
            '<hr>' +
            '<div>' +
            '<p class="card-time">' +reminder['message']+ '</p>' +
            '</div>' +
            '<br>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</li>';
        dom.appendChild(createElementFromHTML(content));
    },
    addToLatestReminders: function (reminder) {
        var ul = document.getElementById("enduser-latest-reminders");
        while (ul.firstChild) {
            ul.removeChild(ul.firstChild);
        }
        var timestamp = reminder['timestamp'];
        var t = new Date(timestamp*1000);
        var formatted = t.getDate() + "." + (t.getMonth() + 1) + "." + t.getFullYear() + " " + ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2);
        var content= '<li>' +
            '<div class="row">' +
            '<div class="col-4 left-border">' +
            '</div>' +
            '<div class="col-4">' +
            '<img class="enduser-latest-reminder-img" src="'+ getImageForReminderType(reminder['type']) + '"/>' +
            '</div>' +
            '<div class="col-4 right-border">' +
            '</div>' +
            '</div>' +
            '<div class="latest-reminder-container">' +
            '<div class="row">' +
            '<div class="col-1"></div>' +
            '<div class="col-10 latest-reminder-content1">' +
             reminder['description'] +
            '</div>' +
            '<div class="col-1"></div>' +
            '</div>' +
            '<hr/>' +
            '<div class="row">' +
            '<div class="col-1"></div>' +
            '<div class="col-10 latest-reminder-content2">' +
            reminder['message'] +
            '</div>' +
            '<div class="col-1"></div>' +
            '</div>' +
            '<div class="row">' +
            '<div class="col-6">' +
            '<div class="btn-reminder">' +
            '<i class="fa fa-check"></i>' +
            '<br>' +
            'Check' +
            '</div>' +
            '</div>' +
            '<div class="col-6">' +
            '<div class="btn-reminder">' +
            '<i class="fa fa-times"></i>' +
            '<br>' +
            'Cancel' +
            '</div>' +
            '</div>' +
            '</div>' +
            ' </div>' +
            '</li>';
            ul.appendChild(createElementFromHTML(content));

    },

    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.initFastClick();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    initFastClick : function() {
        window.addEventListener('load', function() {
            FastClick.attach(document.body);
        }, false);
    },
    // Phonegap is now ready...
    onDeviceReady: function() {

    }


};