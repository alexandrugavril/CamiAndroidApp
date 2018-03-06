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
        case ('exercise'):
            return 'img/steps-ok.png';
        default:
            return ""
    }
}

function openTab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    var cTab = document.getElementById(tabName);
    cTab.style.display = "block";

    evt.currentTarget.className += " active";
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

function checkReminder()
{
    console.log("Check: " + app.reminders[0]);
    var url = "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/" + app.reminders[0].id + "/";
    $.ajax({
        url : url,
        data : JSON.stringify({'acknowledged': true}),
        type : 'PATCH',
        contentType : 'application/json',
        success: function () {
            console.log("Success");
            location.reload();

        },
        error: function () {
            alert("Reminder was not acknowledged.");
            location.reload();

        }
    });

}

function checkIfUserAlreadyLogged()
{
    var user = window.localStorage.getItem("user");
    return user !== undefined;
}

function cancelReminder()
{
    console.log("Check: " + app.reminders[0]);
    var url = "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/" + app.reminders[0].id + "/";
    $.ajax({
        url : url,
        data : JSON.stringify({'acknowledged': false}),
        type : 'PATCH',
        contentType : 'application/json',
        success: function () {
            console.log("Success");
            location.reload();

        },
        error: function () {
            alert("Reminder was not acknowledged.");
            location.reload();

        }
    });
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
                    if(t > d)
                    {
                        app.reminders.push(rems[i]);
                    }
                }
            }
            if(app.reminders.length > 0)
                app.addToLatestReminders(app.reminders[0]);
            else {
                app.onNoLatestReminders();
            }
            console.log(app.reminders);
        },
        error: function () {
            alert("Cannot receive reminders. Check your internet connection!");
            logOff();
        }

    });
}

function logOff()
{
    window.localStorage.removeItem("user");
    $.mobile.navigate("#login-page", { transition : "slide", info: "Login Failed"});
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
                console.log("Registered user");
            },
            error: function( jqXhr, textStatus, errorThrown ){
                console.log("Already registered");
            }
        });
    });
}

function handleLogin() {
    var form = $("#loginForm");
    //disable the button so we can't resubmit while we wait
    var u = $("#username", form).val();
    var p = $("#password", form).val();

    checkLogin(u, p);
    return false;
}

function checkLogin(u, p)
{

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
                                window.localStorage.setItem("user", JSON.stringify({'user': u, 'password': p}));
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
                                    window.localStorage.setItem("user",  JSON.stringify({'user': u, 'password': p}));
                                    $.mobile.navigate("#caregiver-page", { transition : "slide"});
                                }
                            }
                            else {
                                Materialize.toast('Login Failed!', 1000, 'rounded');// 4000 is the duration of the toast
                                logOff();
                            }
                        }
                    }
                    else {
                        Materialize.toast('Login Failed!', 1000, 'rounded');// 4000 is the duration of the toast
                        logOff();
                    }
                }).error(
                function() {
                    Materialize.toast('Login Failed!', 1000, 'rounded');// 4000 is the duration of the toast
                    logOff();
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
    plotWeightChart: function(ctx)
    {
        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=weight&limit=7&order_by=-timestamp&user=2";
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (data) {
                var pData = data.measurements;
                var labs = [];
                var dataValues = [];
                for (var i = 0; i < pData.length; i++) {
                    var t = new Date(pData[i].timestamp*1000);
                    var month = t.getMonth() + 1;
                    if(month < 10)
                    {
                        month = "0" + month;
                    }
                    var formatted = t.getDate() + "/" + month;
                    labs.push(formatted);
                    dataValues.push(pData[i].value_info.value)
                }

                var myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labs,
                        datasets: [{
                            label: 'Weight',
                            data: dataValues,
                            backgroundColor:
                                'rgba(122,122, 132, 0.2)'
                            ,
                            borderColor: 'rgba(122,122,132,1)'

                        }]
                    },
                    options: {
                        maintainAspectRatio: false,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: false,
                                }
                            }]
                        }
                    }
                });
            }
        });
    },
    plotHeartRateChart: function(ctx) {
        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=pulse&limit=7&order_by=-timestamp&user=2";
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (data) {
                var pData = data.measurements;
                var labs = [];
                var dataValues = [];
                for (var i = 0; i < pData.length; i++) {
                    var t = new Date(pData[i].timestamp*1000);
                    var month = t.getMonth() + 1;
                    if(month < 10)
                    {
                        month = "0" + month;
                    }
                    var formatted = t.getDate() + "/" + month;
                    labs.push(formatted);
                    dataValues.push(pData[i].value_info.value)
                }

                var myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labs,
                        datasets: [{
                            label: 'Heart Rate',
                            data: dataValues,
                            backgroundColor:'rgba(255,99, 132, 0.2)',
                            borderColor:  'rgba(255,99,132,1)'

                        }]
                    },
                    options: {
                        maintainAspectRatio: false,
                        scales: {
                            yAxes: [{
                                ticks: {
                                }
                            }]
                        }
                    }
                });
            }
        });


    },
    plotBloodPressureChart: function(ctx) {
        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=blood_pressure&limit=7&order_by=-timestamp&user=2";
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (data) {
                var pData = data.measurements;
                pData = pData.reverse();
                var labs = [];
                var diastolicValues = [];
                var systolicValues = [];
                var backgroundColorD= [];
                var borderColorD= [];
                var backgroundColorS = [];
                var borderColorS = [];
                for (var i = 0; i < pData.length; i++) {
                    var t = new Date(pData[i].timestamp*1000);
                    var month = t.getMonth() + 1;
                    if(month < 10)
                    {
                        month = "0" + month;
                    }
                    var formatted = t.getDate() + "/" + month;
                    labs.push(formatted);
                    diastolicValues.push(pData[i].value_info.diastolic);
                    backgroundColorD.push('rgba(255, 99, 132, 0.2)');
                    backgroundColorS.push('rgba(255, 99, 0, 0.2)');
                    borderColorD.push('rgba(255,99,132,1)');
                    borderColorS.push('rgba(255,99,0,1)');
                    systolicValues.push(pData[i].value_info.systolic);
                }



                var lineChartData = {
                    labels: labs,
                    datasets: [{
                        label: "Diastolic",
                        backgroundColor: backgroundColorD,
                        borderColor: borderColorD,
                        fill: false,
                        data: diastolicValues,
                        yAxisID: "y-axis-1",
                    }, {
                        label: "Systolic",
                        backgroundColor: backgroundColorS,
                        borderColor: borderColorS,
                        fill: false,
                        data: systolicValues,
                    }]
                };


                var myChart  = Chart.Bar(ctx, {
                    data: lineChartData,
                    scaleOverride: true,
                    scaleSteps: 5,
                    scaleStepWidth: 5,
                    options: {

                        maintainAspectRatio: false,
                        responsive: true,
                        hoverMode: 'index',
                        stacked: false,
                        scales: {
                            yAxes: [{
                                type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                                display: true,
                                position: "left",
                                beginAtZero: true,
                                fontSize: 12,
                                id: "y-axis-1"
                            }],
                            xAxes: [{
                                fontSize: 12,
                                id: "x-axis-1"
                            }]
                        }
                    }
                });
            }
        });

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
    onNoLatestReminders: function ()
    {
        var ul = document.getElementById("enduser-latest-reminders");
        var ul = document.getElementById("enduser-latest-reminders");
        while (ul.firstChild) {
            ul.removeChild(ul.firstChild);
        }
        var content= '<li>' +
            '<div class="row">' +
             '<div class="col-12">' +
            '<h1>' +
            'No new reminders!'+
            '</h1>' +
            '</div>'+
            '</div>';

        ul.appendChild(createElementFromHTML(content));
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
            '<div class="latest-reminder-container half-height">' +
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
            '<div id="checkReminderBtn" class="btn-reminder">' +
            '<i class="fa fa-check"></i>' +
            '<br>' +
            'Check' +
            '</div>' +
            '</div>' +
            '<div class="col-6">' +
            '<div id="cancelReminderBtn" class="btn-reminder">' +
            '<i class="fa fa-times"></i>' +
            '<br>' +
            'Cancel' +
            '</div>' +
            '</div>' +
            '</div>' +
            ' </div>' +
            '</li>';
            ul.appendChild(createElementFromHTML(content));

        $("#checkReminderBtn").click(checkReminder);
        $("#cancelReminderBtn").click(cancelReminder);

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