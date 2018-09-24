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

function acknowledgeReminder(id)
{
    var url = "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/" + id + "/";
    $.ajax({
        url : url,
        data : JSON.stringify({'acknowledged': true}),
        type : 'PATCH',
        contentType : 'application/json',
        success: function () {
            location.reload();
        },
        error: function () {
            alert(app.model.translations.operation_failed_error);
            location.reload();

        }
    });
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

function getImageForReminderType(type, severity)
{
    switch(type) {
        case ('medication'):
            return 'img/pill-2-xxl.png';
        case ('appointment'):
            return 'img/journal-menu-' + severity + '.png';
        case ('weight'):
            return 'img/weight-' + severity + '.png';
        case ('heart'):
            return 'img/heart-' + severity + '.png';
        case ('steps'):
            return 'img/steps-'+ severity +'.png';
        case ('exercise'):
            return 'img/exercise-' + severity + '.png';
        default:
            return "";
    }
}

function getImageForReminderStatus(status)
{
    if(status !== null && status !== undefined)
    {
        if(status)
        {
            return "img/acknowledged.png";
        }
        else{
            return "img/notAcknowledged.png";
        }
    }
    else{
        return "img/unknown.png";
    }
}

function checkReminder()
{
    var url = "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/" + app.model.latestReminders[0].id + "/";
    $.ajax({
        url : url,
        data : JSON.stringify({'acknowledged': true}),
        type : 'PATCH',
        contentType : 'application/json',
        success: function () {
            location.reload();
        },
        error: function () {
            alert(app.model.translations.operation_failed_error);
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
    var url = "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/" + app.model.latestReminders[0].id + "/";
    $.ajax({
        url : url,
        data : JSON.stringify({'acknowledged': false}),
        type : 'PATCH',
        contentType : 'application/json',
        success: function () {
            location.reload();

        },
        error: function () {
            alert(app.model.translations.operation_failed_error);
            location.reload();

        }
    });
}

function getRandomNumber(rangeInit, rangeFinal)
{
    return Math.floor(Math.random() * rangeFinal) + rangeInit;
}

var urgencyTypes = {
    "next" : "next-type",
    "old" :"old-type",
    "future": "future-type"
};

function getActivityType(timestamp)
{
    var d = new Date();
    var t = new Date(timestamp);
    if(t > d)
    {
        return urgencyTypes.future;
    }
    if(t < d)
    {
        return urgencyTypes.old;
    }
}

function getActivities(userId)
{
    var d = new Date();
    var dateOffset = 30*60*1000;
    var url = "http://cami.vitaminsoftware.com:8008/api/v1/activity/?order_by=-start&user=" + userId;
    $.ajax({
        url: url,
        dataType: "json",
        type: 'GET',
        success: function (data) {
            var initActivities = data.activities;
            var activities = [];
            var currentDate = new Date();
            var diff = -99999999999;
            var nextActivity;
            app.model.activities = [];
            for(var actIdx in initActivities)
            {
                var activity = data.activities[actIdx];
                activity.start = parseInt(activity.start * 1000);
                var activityDate = new Date(activity.start );
                var cdiff = currentDate - activityDate;
                if(cdiff < 0)
                {
                    if(cdiff > diff)
                    {
                        nextActivity = activity;
                        diff = cdiff;
                    }
                }
            }
            var activityDate = new Date(nextActivity.start);

            app.model.nextActivity = {
                severityClass: "high" + ' col-9',
                dayWeek: moment(activityDate).format('ddd'),
                day: moment(activityDate).format('DD'),
                month: moment(activityDate).format('MMM').toUpperCase(),
                hourFormatted: moment(activityDate).format('HH:mm'),
                currentDate: "Today " + moment(new Date()).format("DD MMM"),
                urgencyType: urgencyTypes.next,
                date: new Date(nextActivity.start),
                message: nextActivity.description,
                description: nextActivity.title,
                location: nextActivity.location
            };


            for(var actIdx in initActivities)
            {
                var activity = data.activities[actIdx];
                var activityDate = new Date(activity.start);
                var activityModel = {
                    severityClass: "medium" + ' col-9',
                    dayWeek: moment(activityDate).format('ddd'),
                    day: moment(activityDate).format('DD'),
                    month: moment(activityDate).format('MMM').toUpperCase(),
                    hourFormatted: moment(activityDate).format('HH:mm'),
                    currentDate: "Today " + moment(new Date()).format("DD MMM"),
                    urgencyType: getActivityType(activity.start),
                    date: new Date(activity.start),
                    message: activity.description,
                    description: activity.title,
                    location: activity.location
                };
                app.model.activities.push(activityModel);

            }
            app.model.activities.reverse();
            app.model.$apply();


        },
        error: function () {
            alert(app.model.translations.error_connection);
            logOff();
        }

    });
}


function getReminders(userId)
{
    $.ajax({
        url: "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/?user=" + userId,
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
            app.model.latestReminders = [];
            app.model.allReminders = [];

            for (var i = 0; i < rems.length; i++) {
                var timestamp = rems[i]['timestamp'];
                console.log(rems[i]);

                var t = new Date(timestamp*1000);
                var date = moment(t).format('ddd D MMM');
                var today = moment(Date.now()).format('ddd D MMM');
                rems[i].image = getImageForReminderType(rems[i]['type'], rems[i].severity);
                rems[i].date = moment(t).format('HH:mm');
                rems[i].dayMonth = moment(t).format('DD/MM HH:mm');
                rems[i].severityClass = rems[i].severity + ' col-9';
                rems[i].statusImage = getImageForReminderStatus(rems[i].acknowledged);
                rems[i].check = app.model.translations.check;
                rems[i].canAcknowledge = rems[i].acknowledged !== true;
                if(date in remsByDay)
                {
                    remsByDay[date].push(rems[i]);
                }
                else {
                    remsByDay[date] = [];
                    remsByDay[date].push(rems[i]);
                }
                if(t > d && !(rems[i].acknowledged === true || rems[i].acknowledged === false))
                {
                    app.model.latestReminders.push(rems[i]);
                }
                app.model.allReminders.push(rems[i]);
            }
            app.model.reminders = remsByDay;
            app.model.$apply();

        },
        error: function () {
            alert(app.model.translations.error_connection);
            logOff();
        }

    });
}

function logOff()
{
    var user = window.localStorage.getItem("user");
    window.localStorage.removeItem("user");
    location.reload();
    $.mobile.navigate("#login-page", { transition : "slide"});
    stopPollingCaregiver();
    stopPollingEnduser();
    user = JSON.parse(user);
    if(user !== null && user !== undefined) {
        var form = $("#loginForm");
        $("#username", form).val(user['user']);
        $("#password", form).val(user['password']);
    }
}
function getUrgentAlert()
{
    if(app.model.latestReminders && app.model.latestReminders.length > 0)
        app.model.urgentReminder = app.model.latestReminders[0];
    app.model.$apply();
}
function registerNotifications()
{
    if(window.plugins && window.plugins.PushbotsPlugin)
    {
        window.plugins.PushbotsPlugin.initialize("5ab360061db2dc58e27048a0", {"android":{"sender_id":"716888555189"}});
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

        window.plugins.PushbotsPlugin.on("notification:received", function(data){
            window.plugins.PushbotsPlugin.incrementBadgeCountBy(1);
            location.reload();

            if(window.localStorage.getItem("user"))
            {
                var userId = JSON.parse(window.localStorage.getItem("user")).careId;
                var careId = JSON.parse(window.localStorage.getItem("user")).id;
                getReminders(careId);
                getUrgentAlert();
            }
            window.plugins.PushbotsPlugin.done(data.pb_n_id);
        });

        window.plugins.PushbotsPlugin.on("notification:clicked", function(data){
            // var userToken = data.token;
            // var userId = data.userId;
            window.plugins.PushbotsPlugin.decrementBadgeCountBy(1);
        });
    }

}

function handleLogin() {
    var form = $("#loginForm");
    //disable the button so we can't resubmit while we wait
    var u = $("#username", form).val();
    if(u === 'cami')
    {
        u = "cami-user-pl-1";
    }
    var p = $("#password", form).val();

    checkLogin(u, p);
    return false;
}

function checkLogin(u, p)
{

    if(u !== '' && p !== '')
    {
        if (p !== 'imac') {
            Materialize.toast('Wrong Password!', 2000, 'rounded');// 4000 is the duration of the toast
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
                            if(profile.language in translations)
                            {
                                app.model.translations = translations[profile.language];
                                window.localStorage.setItem('translations', JSON.stringify(translations[profile.language]));
                                moment.locale(profile.language);
                            }
                            else
                            {
                                app.model.translations = translations['ro'];
                                window.localStorage.setItem('translations', JSON.stringify(translations['ro']));
                                moment.locale('ro');
                            }
                            app.model.$apply();
                            if(account_role === 'end_user')
                            {
                                registerNotifications();
                                window.localStorage.setItem("user", JSON.stringify({'user': u, 'password': p,
                                    'id': users[0].id, 'careId' : users[0].id}));
                                window.localStorage.setItem("lastLoggedUser", JSON.stringify({'user': u, 'password': p,
                                    'id': users[0].id, 'careId' : users[0].id}));
                                $.mobile.navigate("#enduser-page", { transition : "slide"});
                                startPollingEnduser();
                            }
                        }
                        else {
                            profile = users[0]['caregiver_profile'];
                            if(profile)
                            {
                                if(profile.language in translations)
                                {
                                    app.model.translations = translations[profile.language];
                                    window.localStorage.setItem('translations', JSON.stringify(translations[profile.language]));
                                    moment.locale(profile.language);
                                }
                                else {
                                    app.model.translations = translations['ro'];
                                    window.localStorage.setItem('translations', JSON.stringify(translations['ro']));
                                    moment.locale('ro');
                                }
                                app.model.$apply();
                                var account_role = profile['account_role'];
                                if(account_role === 'caregiver')
                                {
                                    registerNotifications();
                                    var atomsId = profile['caretaker'].split('/');
                                    var careId = atomsId[atomsId.length - 2];
                                    window.localStorage.setItem("user",  JSON.stringify({'user': u, 'password': p,
                                        'id': users[0].id, 'careId' : careId}));
                                    window.localStorage.setItem("lastLoggedUser", JSON.stringify({'user': u, 'password': p,
                                        'id': users[0].id, 'careId' : careId}));
                                    $.mobile.navigate("#caregiver-page", { transition : "slide"});
                                    startPollingCaregiver();
                                }
                            }
                            else {
                                Materialize.toast('Wrong Username!', 2000, 'rounded');// 4000 is the duration of the toast
                                logOff();
                            }
                        }
                    }
                    else {
                        Materialize.toast('Wrong Username!', 2000, 'rounded');// 4000 is the duration of the toast
                        logOff();
                    }
                }).error(
                function() {
                    Materialize.toast('Connection failed! Please try again later.', 2000, 'rounded');// 4000 is the duration of the toast
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

function updateTranslations()
{
    var translations = JSON.parse(window.localStorage.getItem('translations'));
    if(translations)
    {
        app.model.translations = translations;
        app.model.$apply();
    }
}

function checkAlreadyLogged() {
    if(checkIfUserAlreadyLogged())
    {
        var user = window.localStorage.getItem("user");
        user = JSON.parse(user);
        if(user !== null && user !== undefined)
        {
            checkLogin(user['user'], user['password']);
        }
    }
    else {
        var lastLoggedUser = window.localStorage.getItem("lastLoggedUser");
        if(lastLoggedUser !== undefined)
        {
            lastLoggedUser = JSON.parse(lastLoggedUser);
            var form = $("#loginForm");
            $("#username", form).val(lastLoggedUser['user']);
            $("#password", form).val(lastLoggedUser['password']);
        }

    }
}

var app = {
    SOME_CONSTANTS : false,  // some constant
    user: {},
    reminders: [],
    currentReminder: -1,
    severities: {
        mediumHigh: "mediumHighSeverity",
        high: "highSeverity",
        medium: "mediumSeverity",
        low: "lowSeverity",
        none: "noneSeverity"
    },
    userProfile: {
        height: 187,
        bmi: {
            low: 18.5,
            medium: 25,
            high: 30
        },
        systolicBP: {
            min: 95,
            max: 130
        },
        diastolicBP: {
            min:55,
            max: 90
        },
        heartRate: {
            min: 60,
            max: 100
        },
        steps: {
            min: 5500,
            max: 10000
        },
        sleep: {
            min: 420,
            max: 540
        }
    },
    getWeightSeverity: function(value) {
        var height = this.userProfile.height;

        var BMI = Math.round(value / Math.pow(height, 2) * 10000);
        var output = Math.round(BMI * 100) / 100;
        if (output < this.userProfile.bmi.low){
            return this.severities.medium;
        }
        else if (output >= this.userProfile.bmi.low && output <= this.userProfile.bmi.medium) {
            return this.severities.low;
        }
        else if (output >= this.userProfile.bmi.medium && output <= this.userProfile.bmi.high) {
            return this.severities.mediumHigh;
        }
        else if (output > this.userProfile.bmi.high){
            return this.severities.high;
        }
        return this.severities.none;
    },
    getHeartRateSeverity: function(value) {
        if (value < this.userProfile.heartRate.min){
            return this.severities.high;
        }
        else if (value >= this.userProfile.heartRate.min && value <= this.userProfile.heartRate.max) {
            return this.severities.low;
        }
        else if (value > this.userProfile.heartRate.max) {
            return this.severities.high;
        }
        return this.severities.none;
    },
    getBloodPressureSeverity: function(valueSist, valueDiast) {
        if (valueSist >= this.userProfile.systolicBP.min && valueSist <= this.userProfile.systolicBP.max &&
            valueDiast >= this.userProfile.diastolicBP.min && valueDiast <= this.userProfile.diastolicBP.max)
        {
            return this.severities.low;
        }
        return this.severities.high;
    },
    getStepsSeverity: function(value) {
        if (value < this.userProfile.steps.min){
            return this.severities.high;
        }
        else if (value >= this.userProfile.steps.min && value <= this.userProfile.steps.max) {
            return this.severities.low;
        }
        else if (value > this.userProfile.steps.max) {
            return this.severities.high;
        }
        return this.severities.none;
    },
    getSleepSeverity: function(value) {
        if (value < this.userProfile.sleep.min){
            return this.severities.high;
        }
        else if (value >= this.userProfile.sleep.min && value <= this.userProfile.sleep.max) {
            return this.severities.low;
        }
        else if (value > this.userProfile.sleep.max) {
            return this.severities.high;
        }
        return this.severities.none;
    },
    plotWeightChart: function(ctx, userId) {
        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=weight&limit=7" +
            "&order_by=-timestamp&user=" + userId;
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (data) {
                var pData = data.measurements.reverse();
                var labs = [];
                var dataValues = [];
                var minVal = 999;
                var maxVal = 0;
                var padding = 10;


                for (var i = 0; i < pData.length; i++) {
                    var t = new Date(pData[i].timestamp*1000);
                    var month = t.getMonth() + 1;
                    if(month < 10)
                    {
                        month = "0" + month;
                    }
                    var formatted = t.getDate() + "/" + month;
                    labs.push(formatted);
                    dataValues.push(pData[i].value_info.value);
                    if(pData[i].value_info.value < minVal)
                    {
                        minVal = pData[i].value_info.value;
                    }
                    if(pData[i].value_info.value > maxVal)
                    {
                        maxVal = pData[i].value_info.value;
                    }
                }

                var paddingMin = minVal % padding;
                var paddingMax = padding - maxVal % padding;

                var latestValue = pData[pData.length - 1].value_info.value;
                app.model.latestWeightValue = latestValue;
                app.model.latestWeightSeverity = app.getWeightSeverity(latestValue);
                app.model.$apply();
                var myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labs,
                        datasets: [{
                            label: app.model.translations.weight + " (kg)",
                            data: dataValues,
                            pointHitRadius: 15,
                            backgroundColor:
                                'rgba(122,122, 132, 0.2)'
                            ,
                            borderColor: 'rgba(122,122,132,1)'

                        }]
                    },
                    options: {

                        maintainAspectRatio: true,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: false,
                                    min: Math.round(minVal - paddingMin),
                                    max: Math.round(maxVal + paddingMax)
                                }
                            }]
                        }
                    }
                });
            }
        });
    },
    plotHeartRateChart: function(ctx, userId) {
        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=pulse&limit=7&" +
            "order_by=-timestamp&user=" + userId;
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (data) {
                var pData = data.measurements.reverse();
                var labs = [];
                var dataValues = [];
                var minVal = 999;
                var maxVal = 0;

                var padding = 10;
                var paddingMin = 0;
                var paddingMax = 0;

                for (var i = 0; i < pData.length; i++) {
                    var t = new Date(pData[i].timestamp*1000);
                    var month = t.getMonth() + 1;
                    if(month < 10)
                    {
                        month = "0" + month;
                    }
                    var formatted = t.getDate() + "/" + month;
                    labs.push(formatted);
                    dataValues.push(pData[i].value_info.value);
                    if(pData[i].value_info.value < minVal)
                    {
                        minVal = pData[i].value_info.value;
                    }
                    if(pData[i].value_info.value > maxVal)
                    {
                        maxVal = pData[i].value_info.value;
                    }
                }
                paddingMin = minVal % padding;
                paddingMax = padding - maxVal % padding;

                var latestValue = pData[pData.length - 1].value_info.value;
                app.model.latestHeartRateValue = latestValue;
                app.model.latestHeartRateSeverity = app.getHeartRateSeverity(latestValue);
                app.model.$apply();

                var myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labs,
                        datasets: [{
                            label: app.model.translations.heart_rate + " (bpm)",
                            pointHitRadius: 15,
                            data: dataValues,
                            backgroundColor:'rgba(255,99, 132, 0.2)',
                            borderColor:  'rgba(255,99,132,1)'

                        }]
                    },
                    options: {
                        maintainAspectRatio: true,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: false,
                                    min: Math.round(minVal - paddingMin),
                                    max: Math.round(maxVal + paddingMax)
                                }
                            }]
                        }
                    }
                });
            }
        });


    },
    plotBloodPressureChart: function(ctx, userId) {
        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=blood_pressure&limit=7&" +
            "order_by=-timestamp&user=" + userId;
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (bpDataRaw) {
                var bpData = bpDataRaw.measurements.reverse();
                if(bpData.length > 0)
                {
                    var labs = [];
                    var diastolicValues = [];
                    var systolicValues = [];
                    var heartRateValues = [];

                    var backgroundColorD= [];
                    var borderColorD= [];
                    var backgroundColorS = [];
                    var borderColorS = [];
                    var backgroundColorHR = [];
                    var borderColorHR = [];

                    for (var i = 0; i < bpData.length; i++) {
                        var t = new Date(bpData[i].timestamp*1000);
                        var month = t.getMonth() + 1;
                        if(month < 10)
                        {
                            month = "0" + month;
                        }
                        var formatted = t.getDate() + "/" + month;
                        labs.push(formatted);
                        diastolicValues.push(bpData[i].value_info.diastolic);
                        systolicValues.push(bpData[i].value_info.systolic);
                        heartRateValues.push(bpData[i].value_info.pulse);

                        backgroundColorD.push('rgba(15, 99, 255, 0.2)');
                        backgroundColorS.push('rgba(255, 99, 0, 0.2)');
                        backgroundColorHR.push('rgba(255, 0, 15, 0.2)');
                    }

                    var latestValue = bpData[bpData.length - 1].value_info.systolic + " / " + bpData[bpData.length - 1].value_info.diastolic;
                    app.model.latestBloodPressureValue = latestValue;
                    app.model.latestBloodPressureSeverity = app.getBloodPressureSeverity(bpData[bpData.length - 1].value_info.systolic,
                        bpData[bpData.length - 1].value_info.diastolic);
                    app.model.$apply();


                    var lineChartData = {
                        labels: labs,
                        datasets: [{
                            label: app.model.translations.diastolic,
                            backgroundColor: backgroundColorD,
                            fill: false,
                            data: diastolicValues,
                            yAxisID: "y-axis-1",
                        }, {
                            label: app.model.translations.systolic,
                            backgroundColor: backgroundColorS,
                            fill: false,
                            data: systolicValues,
                        },
                        {
                            label: app.model.translations.heart_rate + " (bpm)",
                            backgroundColor: backgroundColorHR,
                            fill: true,
                            data: heartRateValues,
                        }]
                    };


                    var myChart  = Chart.Bar(ctx, {
                        data: lineChartData,
                        scaleOverride: true,
                        scaleSteps: 5,
                        scaleStepWidth: 5,
                        options: {

                            maintainAspectRatio: true,
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

            }
        });

    },
    plotStepsChart : function(ctx, userId) {
        var dataDict = {};
        for( var i = 6 ; i >= 0; i--)
        {
            var t = new Date(Date.now());
            t.setDate(t.getDate() - i);
            var month = t.getMonth() + 1;
            if(month < 10)
            {
                month = "0" + month;
            }
            var formatted = t.getDate() + "/" + month;
            dataDict[formatted] = 0;
        }
        var timestamp = new Date(Date.now());
        timestamp.setDate(timestamp.getDate() - 6);
        timestamp = Math.round(timestamp.getTime() / 1000);

        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=steps" +
            "&order_by=-timestamp&value_info__start_timestamp__gte=" + timestamp + "&limit=1000&user=" + userId;

        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=steps" +
            "&order_by=-timestamp&value_info__start_timestamp__gte=" + timestamp + "&limit=1000&user=" + userId;
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (data) {
                var pData = data.measurements.reverse();
                for (var i = 0 ; i < pData.length; i++)
                {
                    var date = new Date(pData[i].timestamp*1000);
                    var month = date.getMonth() + 1;
                    if(month < 10)
                    {
                        month = "0" + month;
                    }
                    var formatted = date.getDate() + "/" + month;

                    if(formatted in dataDict)
                    {
                        dataDict[formatted] += pData[i].value_info.value;
                    }
                }
                var labs = [];
                var dataValues = [];
                var latestValue = 0;
                for(var key in dataDict){
                    labs.push(key);
                    dataValues.push(dataDict[key]);
                    latestValue = dataDict[key];
                }
                app.model.latestStepsValue = latestValue;
                app.model.latestStepsSeverity = app.getStepsSeverity(latestValue);
                app.model.$apply();

                var myChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labs,
                        datasets: [{
                            label: app.model.translations.steps,
                            data: dataValues,
                            backgroundColor:'rgba(12,12, 255, 0.2)',
                            borderColor:  'rgba(121,99,132,1)'

                        }]
                    },
                    options: {
                        maintainAspectRatio: true,
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
    plotSleepChart: function(ctx, userId) {
        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=sleep&limit=7&" +
            "order_by=-timestamp&user=" + userId;
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (data) {
                var pData = data.measurements.reverse();
                var labs = [];
                var dataValues = [];
                var minVal = 999;
                var maxVal = 0;
                var padding = 100;

                for (var i = 0; i < pData.length; i++) {
                    var t = new Date(pData[i].timestamp*1000);
                    var month = t.getMonth() + 1;
                    if(month < 10)
                    {
                        month = "0" + month;
                    }
                    var formatted = t.getDate() + "/" + month;
                    labs.push(formatted);
                    dataValues.push(pData[i].value_info.value);
                    if(pData[i].value_info.value < minVal)
                    {
                        minVal = pData[i].value_info.value;
                    }
                    if(pData[i].value_info.value > maxVal)
                    {
                        maxVal = pData[i].value_info.value;
                    }
                }
                var latestValue = pData[pData.length - 1].value_info.value;

                var paddingMin = minVal % padding;
                var paddingMax = padding - maxVal % padding;

                app.model.latestSleepSeverity = app.getSleepSeverity(latestValue);
                app.model.latestSleepValue = latestValue;
                app.model.$apply();

                var myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labs,
                        datasets: [{
                            pointHitRadius: 15,
                            scale: 10,
                            label: app.model.translations.sleep + " (min)",
                            data: dataValues,
                            backgroundColor:'rgba(255,12, 255, 0.2)',
                            borderColor:  'rgba(255,99,132,1)'

                        }]
                    },
                    options: {
                        layout: {
                            padding: {
                                left: 5,
                                right: 5,
                                top: 5,
                                bottom: 5
                            }
                        },
                        maintainAspectRatio: true,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min: Math.round(minVal - paddingMin),
                                    max: Math.round(maxVal + paddingMax)
                                }
                            }]
                        }
                    }
                });
            }
        });
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
