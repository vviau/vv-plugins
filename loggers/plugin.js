
arc.run(['$rootScope', function($rootScope) {

    $rootScope.plugin("loggers", "LOGGERS", "page", {
        menu: "administration",
        icon: "fa-sliders",
        description: "This plugin displays loggers and allows the user to change the log level.",
        author: "Cubewise",
        url: "https://github.com/cubewise-code/arc-plugins",
        version: "1.0.0"
    });

}]);

arc.directive("loggers", function () {
    return {
        restrict: "EA",
        replace: true,
        scope: {
            instance: "=tm1Instance"
        },
        templateUrl: "__/plugins/loggers/template.html",
        link: function ($scope, element, attrs) {

        },
        controller: ["$scope", "$rootScope", "$http", "$timeout", "$tm1", "$dialogs", "$helper", "$filter", function ($scope, $rootScope, $http, $timeout, $tm1, $dialogs, $helper, $filter) {

            $scope.now = new Date();
            $scope.selections = {
                filter: "",
                levelFilter: "All"
            };

            if(!$rootScope.uiPrefs.sessionInterval){
                // Set the session interval if it doesn't exist
                // uiPrefs is stored in the browser
                $rootScope.uiPrefs.sessionInterval = 1000;
            }

            $scope.levels = ['Fatal', 'Error', 'Warning', 'Info', 'Debug', 'Unknown', 'Off'];
            $scope.levelFilters = 'All';

            var load = function(){
                $scope.reload = false;
                // Loads the logger information from TM1
                // First part of URL is the encoded instance name and then REST API URL (excluding api/v1/)
                $http.get(encodeURIComponent($scope.instance) + "/Loggers").then(function(success, error) {
                    if(success.status == 401){
                        // Set reload to true to refresh after the user logs in
                        $scope.reload = true;
                        return;
                    }
                    else if(success.status < 400){
                        // Set the threads data
                        $scope.loggers = success.data.value;
                        $scope.loggers = _.orderBy($scope.loggers, ['Name']);
                        //loop through loggers and hide anything that is greater than level 2
                        for (var idx=0;idx<$scope.loggers.length;idx++)
                        {
                            $scope.loggers[idx].isExpanded = false;
                            $scope.loggers[idx].iLevel = ($scope.loggers[idx].Name.match(/\./g) || []).length;
                            if ($scope.loggers[idx].iLevel > 1)
                            {
                                $scope.loggers[idx].hide = true;
                            }
                            var sParent = $scope.loggers[idx].Name + '.';
                            if (idx < $scope.loggers.length-1)
                            {
                                $scope.loggers[idx].hasChildren = _.startsWith($scope.loggers[idx+1].Name, sParent);
                                $scope.loggers[idx].isExpanded = false;
                            }
                            if ($scope.loggers[idx].iLevel == 0)
                            {
                                $scope.loggers[idx].isExpanded = true;
                            }
                        }
                    } else {
                        // Error to display
                        if(success.data && success.data.error && success.data.error.message){
                            $scope.message = success.data.error.message;
                        }
                        else {
                            $scope.message = success.data;
                        }
                        $timeout(function(){
                            $scope.message = null;
                        }, 5000);
                    }
                });
            };

            // Load the loggers the first time
            load();

            var refreshLoggerLevels = function(item){
                $scope.reload = false;
                // Refreshes the logger information from TM1
                // First part of URL is the encoded instance name and then REST API URL (excluding api/v1/)
                $http.get(encodeURIComponent($scope.instance) + "/Loggers").then(function(success, error) {
                    if(success.status == 401){
                        // Set reload to true to refresh after the user logs in
                        $scope.reload = true;
                        return;
                    }
                    else if(success.status < 400){
                        // Set the logger data
                        var updatedLoggers = success.data.value;
                        updatedLoggers = _.orderBy(updatedLoggers, ['Name']);
                        //loop through loggers and update the loggers
                        for (var idx=0;idx<updatedLoggers.length;idx++)
                        {
                            if ($scope.loggers[idx].Level != updatedLoggers[idx].Level)
                            {
                                $scope.loggers[idx].Level = updatedLoggers[idx].Level;
                            }
                        }
                    } else {
                        // Error to display
                        if(success.data && success.data.error && success.data.error.message){
                            $scope.message = success.data.error.message;
                        }
                        else {
                            $scope.message = success.data;
                        }
                        $timeout(function(){
                            $scope.message = null;
                        }, 5000);
                    }
                });
            };

            $scope.expandCollapse = function(item){
                var sParent = item.Name + '.';
                var isExpanded = item.isExpanded;

                //find first item match
                var first = _.findIndex($scope.loggers, function(logger) { return _.startsWith(logger.Name,sParent); });
                //find last item match
                var last = _.findLastIndex($scope.loggers, function(logger) { return _.startsWith(logger.Name,sParent); });
                
                if (item.isExpanded)
                {
                    for (var idx=first;idx<=last;idx++)
                    {
                        $scope.loggers[idx].hide = true;
                        $scope.loggers[idx].isExpanded = false;
                    }
                }
                else
                {
                    for (var idx=first;idx<=last;idx++)
                    {
                        if ($scope.loggers[idx].iLevel == item.iLevel + 1)
                        {
                            $scope.loggers[idx].hide = false;
                            $scope.loggers[idx].isExpanded = false;
                        }
                    }
                }
                item.isExpanded = !item.isExpanded;
}

            $scope.listFilter = function(item) {
                // Check text filter
                if((!$scope.selections.filter || !$scope.selections.filter.length) && $scope.selections.levelFilter == 'All'){
                    return true;
                }
                var filter = $scope.selections.filter.toLowerCase();
                if ($scope.selections.levelFilter == 'All')
                {
                    if(item.Name.toLowerCase().indexOf(filter) !== -1){
                        return true;
                    }
                }
                else
                {
                    if(item.Name.toLowerCase().indexOf(filter) !== -1 && item.Level == $scope.selections.levelFilter){
                        return true;
                    }
                }
                return false;
            };

           $scope.changeLevel = function(item){

				var newLevel = item.Level;
				var loggerName = item.Name;

                $http.patch(encodeURIComponent($scope.instance) + "/Loggers('" + loggerName + "')",  { "Level" : newLevel }).then(function(success, error) {
                        if(success.status == 401){
                            return;
                        } else if(success.status < 400){
							refreshLoggerLevels();
                            // Success the logger was changed
                        } else {
                            if(success.data && success.data.error && success.data.error.message){
                                $scope.message = success.data.error.message;
                            }
                            else {
                                $scope.message = success.data;
                            }
                            $timeout(function(){
                                $scope.message = null;
                            }, 5000);
                        }
                    }
                );
            };

            $scope.$on("login-reload", function(event, args) {
                // Event to reload the page, normally after the session has timed out
                // Check that instance in args matches your $scope
                if(args.instance === $scope.instance && $scope.reload){
                    load();
                }
            });

            $scope.$on("close-tab", function(event, args) {
                // Event to capture when a user has clicked close on the tab
                if(args.page == "loggers" && args.instance == $scope.instance && args.name == null){
                    // The page matches this one so close it
                    $rootScope.close(args.page, {instance: $scope.instance});
                }
            });

            $scope.$on("$destroy", function(event){
                // Cancel the timeout and any other resources
                clearTimeout($scope.loadTimeout);
            });


        }]
    };
});