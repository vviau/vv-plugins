
// Uncomment the code arc.run.. below to enable this plugin



arc.run(['$rootScope', function ($rootScope) {

   $rootScope.plugin("arcTimeManagement", "Time Management", "page", {
      menu: "tools",
      icon: "fa-calendar",
      description: "This plugin can be used to manage Time dimensions",
      author: "Cubewise",
      url: "https://github.com/cubewise-code/arc-plugins",
      version: "1.0.0"
   });

}]);


arc.directive("arcTimeManagement", function () {
   return {
      restrict: "EA",
      replace: true,
      scope: {
         instance: "=tm1Instance"
      },
      templateUrl: "__/plugins/time-management/template.html",
      link: function ($scope, element, attrs) {

      },
      controller: ["$scope", "$rootScope", "$http", "$tm1", "$translate", "$timeout", function ($scope, $rootScope, $http, $tm1, $translate, $timeout) {

         //Define variables
         $scope.defaults = {
            StartTime: new Date(),
            EndTime: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            datepickerOptions: { enableTime: false },
            useHierarchy: true
         };
         $scope.selections = {
            StartTime: $scope.defaults.StartTime,
            EndTime: $scope.defaults.EndTime,
            format: 'YYYY-MM-DD',
            dimensionName: '',
            dimensionType: 'Day',
            useHierarchy: $scope.defaults.useHierarchy
         };
         $scope.lists = {
            dimensionTypes: ['Day', 'Month', 'Year'],
            dateFormats: {
               Day: { format: 'YYYY-MM-DD', formats: ['YYYY-MM-DD', 'YYYY-MM-dd', 'YYYY/MM/dd', 'dd-MM-YYYY', 'dd/MM/YYYY', 'yy-MM-dd', 'YY/MM/dd', 'dd/MM/YY', 'short', 'medium', 'fullDate', 'longDate', 'mediumDate', 'shortDate'] },
               Month: { format: 'YYYY-MM', formats: ['YYYY-MM', 'MM-YYYY', 'MM/YY', 'MM/YYYY', 'MM-YY', 'YY/MM', 'MM/YY', 'short', 'medium', 'fullDate', 'longDate', 'mediumDate', 'shortDate'] },
               Year: { format: 'YYYY', formats: ['YYYY', 'YY'] }
            },
            hierarchies: {
               Day: [{ included: true, type: 'Year-Month-Day', name: 'Year-Month-Day', topConso: 'All Years Month Days', rollUps: [{ level: 'level 2', name: 'Year' }, { level: 'level 1', name: 'Month' }, { level: 'level 0', name: 'Day' }] },
               { included: true, type: 'Year-Day', name: 'Year-Day', topConso: 'All Years Days', rollUps: [{ level: 'level 1', name: 'Year' }, { level: 'level 0', name: 'Day' }] }]
            },
            attributeTypes: ['Alias', 'String', 'Numeric'],
            attributes: {
               Day: [{ Alias: [{ included: true, type: 'YYYY-MM-DD', desc: 'YYYY-MM-DD' }, { included: true, type: 'YYYY/MM/DD', desc: 'YYYY/MM/DD' }] },
               { String: [{ included: true, type: 'WeekDay', desc: 'Week Day' }, { included: true, type: 'Month', desc: 'Month' }] },
               { Numeric: [{ included: true, type: 'Num Day', desc: 'Num Day' }, { included: true, type: 'Month Number', desc: 'Month Number' }] }],
               Month: [{ Alias: [{ included: true, type: 'YYYY-MM-DD', desc: 'YYYY-MM-DD' }, { included: true, type: 'YYYY/MM/DD', desc: 'YYYY/MM/DD' }] },
               { String: [{ included: true, type: 'WeekDay', desc: 'Week Day' }, { included: true, type: 'Month', desc: 'Month' }] },
               { Numeric: [{ included: true, type: 'Num Day', desc: 'Num Day' }, { included: true, type: 'Month Number', desc: 'Month Number' }] }],
               Year: [{ Alias: [{ included: true, type: 'YYYY', desc: 'YYYY' }, { included: true, type: 'YY', desc: 'YY' }] }
               ]
            }
         };
         $scope.values = {};

         $scope.generateExamples = function () {
            var dateMoment = moment($scope.selections.StartTime);
            $scope.examples = {
               Day: dateMoment.format($scope.lists.dateFormats['Day'].format),
               Month: dateMoment.format($scope.lists.dateFormats['Month'].format),
               Year: dateMoment.format($scope.lists.dateFormats['Year'].format)
            };
         };

         $scope.generateExamples();

         $scope.generateDimension = function () {
            var startTime = $scope.selections.StartTime;
            var startTimeMoment = moment(startTime);
            console.log(startTimeMoment);
         };

         $scope.generateExamples();

         //Manage color:
         $scope.generateHSLColour = function (string) {
            //HSL refers to hue, saturation, lightness
            var styleObject = {
               "background-color": "",
               "color": "white"
            };
            //for ngStyle format
            var hash = 0;
            var saturation = "50";
            var lightness = "50";
            for (var i = 0; i < string.length; i++) {
               hash = string.charCodeAt(i) + ((hash << 5) - hash);
            }
            var h = hash % 360;
            styleObject["background-color"] = 'hsl(' + h + ', ' + saturation + '%, ' + lightness + '%)';
            return styleObject;
         };


         //Trigger an event after the login screen
         $scope.$on("login-reload", function (event, args) {

         });

         //Close the tab
         $scope.$on("close-tab", function (event, args) {
            // Event to capture when a user has clicked close on the tab
            if (args.page == "arcTimeManagement" && args.instance == $scope.instance && args.name == null) {
               // The page matches this one so close it
               $rootScope.close(args.page, { instance: $scope.instance });
            }
         });

         //Trigger an event after the plugin closes
         $scope.$on("$destroy", function (event) {

         });


      }]
   };
});