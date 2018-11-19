
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
         $scope.startDate = moment().startOf('year');
         $scope.dateRangeStart = moment().startOf('year');
         $scope.dateRangeEnd = moment().endOf('year');
         $scope.startTimeIsOpen = false;
         $scope.endTimeIsOpen = false;

         $scope.defaults = {
            useHierarchy: true,
            useAttributes: true,
            startDayofWeek: 'Mon',
            fiscalYearStartMonth: 'Jul'
         };
         $scope.selections = {
            startDate: $scope.defaults.startDate,
            dateRangeEnd: $scope.defaults.dateRangeEnd,
            StartTimeMoment: moment($scope.defaults.startDate),
            format: 'YYYY-MM-DD',
            dimensionName: 'Day',
            dimensionType: 'Day',
            useHierarchy: $scope.defaults.useHierarchy,
            useAttributes: $scope.defaults.useAttributes,
            startDayofWeek: $scope.defaults.startDayofWeek,
            fiscalYearStartMonth: $scope.defaults.fiscalYearStartMonth
         };
         $scope.lists = {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            separators: {
               YearHalf: { type: 'Year-Half Year', value: '-H' },
               YearQuarter: { type: 'Year-Quarter', value: '-Q' },
               YearWeek: { type: 'Year-Week', value: '-W' },
               YearMonth: { type: 'Year-Month', value: '-M' },
               YearForNight: { type: 'Year-Fortnight', value: '-F' }
            },
            elements: [],
            dimensionTypes: ['Day', 'Month', 'Year'],
            dimensionElementTypes: {
               Day: { leaf: 'Day', rollUps: ['Month', 'Year'], groupConso: 'All Days' },
               Month: { leaf: 'Month', rollUps: ['Year'], groupConso: 'All Months' },
               Year: { leaf: 'Year', groupConso: 'All Years' }
            },
            dateFormats: {
               Day: { format: 'YYYY-MM-DD', formats: ['YYYY-MM-DD', 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'DD/MM/YYYY', 'YY-MM-DD', 'YY/MM/DD', 'DD/MM/YY'] },
               Month: { format: 'YYYY-MM', formats: ['Custom', 'YYYY-MM', 'MM-YYYY', 'MM/YY', 'MM/YYYY', 'MM-YY', 'YY/MM', 'MM/YY'] },
               Year: { format: 'YYYY', formats: ['YYYY', 'YY'] }
            },
            aliases: [
               { included: true, id: 'alias1', name: 'Short Desc' },
               { included: true, id: 'alias2', name: 'Long Desc' },
               { included: true, id: 'alias3', name: 'Description Desc' }
            ],
            aliasesFomat:
            {
               alias1: {
                  Day: {format: 'YYYY-MM-DD'}
                  ,
                  Month: { format: 'YYYY-MM' }
                  ,
                  Year: { format: 'YYYY' }
               },
               alias2: {
                  Day: { format: 'YYYY/MM/DD' }
                  ,
                  Month: { format: 'YYYY/MM' }
                  ,
                  Year: { format: 'YYYY' }
               },
               alias3: {
                  Day: { format: 'DD-MM-YY' }
                  ,
                  Month: { format: 'DD-YY' }
                  ,
                  Year: { format: 'YY' }
               }
            },
            attributes: {
               Day: [{
                  type: 'Alias', attributes: [
                     { included: true, name: 'YYYY-MM-DD', example: $scope.selections.StartTimeMoment.format('YYYY-MM-DD') },
                     { included: true, name: 'YYYY/MM/DD', example: $scope.selections.StartTimeMoment.format('YYYY/MM/DD') }
                  ]
               },
               {
                  type: 'String', attributes: [
                     { included: true, name: 'Year Short', example: $scope.selections.StartTimeMoment.format('YY') },
                     { included: true, name: 'Year Long', example: $scope.selections.StartTimeMoment.format('YYYY') },
                     { included: true, name: 'Month Short', example: $scope.selections.StartTimeMoment.format('MMM') },
                     { included: true, name: 'Month Long', example: $scope.selections.StartTimeMoment.format('MMMM') },
                     { included: true, name: 'Week Day Short', example: $scope.selections.StartTimeMoment.format('ddd') },
                     { included: true, name: 'Week Day Long', example: $scope.selections.StartTimeMoment.format('dddd') }
                  ]
               },
               {
                  type: 'Numeric', attributes: [
                     { included: true, name: 'Num Day', desc: 'Num Day' },
                     { included: true, name: 'Month Number', desc: 'Month Number' }
                  ]
               }],
               Month: [{
                  type: 'Alias', attributes: [
                     { included: true, name: 'YYYY-MM-DD', example: $scope.selections.StartTimeMoment.format('YYYY-MM') },
                     { included: true, name: 'YYYY/MM/DD', example: $scope.selections.StartTimeMoment.format('YYYY/MM') }
                  ]
               },
               {
                  type: 'String', attributes: [
                     { included: true, name: 'Year Short', example: $scope.selections.StartTimeMoment.format('YY') },
                     { included: true, name: 'Year Long', example: $scope.selections.StartTimeMoment.format('YYYY') },
                     { included: true, name: 'Month Short', example: $scope.selections.StartTimeMoment.format('MMM') },
                     { included: true, name: 'Month Long', example: $scope.selections.StartTimeMoment.format('MMMM') }
                  ]
               },
               {
                  type: 'Numeric', attributes: [
                     { included: true, name: 'Num Day', desc: 'Num Day' },
                     { included: true, name: 'Month Number', desc: 'Month Number' }]
               }
               ],
               Year: [
                  {
                     type: 'Alias', attributes: [{ included: true, name: 'YYYY', example: $scope.selections.StartTimeMoment.format('YYYY') },
                     { included: true, name: 'YY', example: $scope.selections.StartTimeMoment.format('YY') }]
                  }
               ]
            },
            hierarchies: {
               Day: [
                  {
                     included: true, show: true, type: 'YMD', name: 'All Months', rollUps: [
                        { level: 'Top', name: 'All Months', attributes: [] },
                        { level: 'level 2', name: 'Year', attributes: [] },
                        { level: 'level 1', name: 'Month', attributes: [] },
                        { level: 'level 0', name: 'Day', attributes: [] }
                     ]
                  },
                  {
                     included: true, show: true,type: 'YHQMD', name: 'All Period', rollUps: [
                        { level: 'Top', name: 'All Period', attributes: [] },
                        { level: 'level 4', name: 'Year', attributes: [] },
                        { level: 'level 3', name: 'Half-Year', attributes: [] },
                        { level: 'level 2', name: 'Quarter', attributes: [] },
                        { level: 'level 1', name: 'Month', attributes: [] },
                        { level: 'level 0', name: 'Day', attributes: [] }
                     ]
                  },
                  {
                     included: true, show: true, type: 'YD', name: 'Year-Day',
                     rollUps: [
                        { level: 'Top', name: 'All Days', attributes: [] },
                        { level: 'level 1', name: 'Year', attributes: [] },
                        { level: 'level 0', name: 'Day', attributes: [] }]
                  }]
            },
            attributeTypes: ['Alias', 'String', 'Numeric'],
         };
         $scope.values = {};

         $scope.attachAttributesToHierarchies = function () {
            _.each($scope.lists.hierarchies, function (value, key) {
               var hierarchies = value;
               var type = key;
               _.each(hierarchies, function (value, key) {
                  var rollUps = value.rollUps;
                  var hierarchy = key;
                  _.each(rollUps, function (value, key) {
                     var rollUp = value.name;
                     var attributes = $scope.lists.attributes[rollUp];
                     $scope.lists.hierarchies[type][hierarchy].rollUps[key].attributes.push(attributes);
                  });
               });
            });
         };

         $scope.attachAttributesToHierarchies();

         $scope.getMonthFormat = function (dateMoment) {
            var formatYear = $scope.lists.dateFormats['Year'].format;
            var formatMonth = $scope.lists.dateFormats['Month'].format;
            var year = dateMoment.format(formatYear);
            if (formatMonth == 'Custom') {
               var yearMonthSeparator = $scope.lists.separators['YearMonth'].value;
               var dateMonthNumber = dateMoment.format('M');
               var month = year + yearMonthSeparator + dateMonthNumber;
            } else {
               var month = dateMoment.format(formatMonth);
            }
            return month;
         };

         $scope.generateExamples = function () {
            // Get format
            var formatDay = $scope.lists.dateFormats['Day'].format;
            var formatYear = $scope.lists.dateFormats['Year'].format;
            // Get date
            var dateMoment = $scope.startDate;
            // Define variables
            var year = dateMoment.format(formatYear);
            var day = dateMoment.format(formatDay);
            $scope.examples = {
               Day: day,
               Month: $scope.getMonthFormat(dateMoment),
               Year: year
            };
         };

         $scope.generateExamples();

         $scope.generateDimension = function () {
            $scope.lists.elements = [];
            var startTimeMoment = $scope.startDate;
            var endTimeMoment = $scope.dateRangeEnd;
            for (var m = moment(startTimeMoment); m.diff(endTimeMoment, 'days') <= 0; m.add(1, 'days')) {
               var day = m.format($scope.lists.dateFormats['Day'].format);
               var month = $scope.getMonthFormat(m);
               var year = m.format($scope.lists.dateFormats['Year'].format);
               var elementInfo = {
                  'leaf': day,
                  'Month': month,
                  'Year': year
               };
               $scope.lists.elements.push(elementInfo);
            }
         };

         $scope.generateDimension();

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

         // START END DATE
         /* Bindable functions
 -----------------------------------------------*/
         $scope.endDateBeforeRender = endDateBeforeRender
         $scope.endDateOnSetTime = endDateOnSetTime
         $scope.startDateBeforeRender = startDateBeforeRender
         $scope.startDateOnSetTime = startDateOnSetTime

         function startDateOnSetTime() {
            $scope.$broadcast('start-date-changed');
         }

         function endDateOnSetTime() {
            $scope.$broadcast('end-date-changed');
         }

         function startDateBeforeRender($dates) {
            if ($scope.dateRangeEnd) {
               var activeDate = moment($scope.dateRangeEnd);

               $dates.filter(function (date) {
                  return date.localDateValue() >= activeDate.valueOf()
               }).forEach(function (date) {
                  date.selectable = false;
               })
            }
         }

         function endDateBeforeRender($view, $dates) {
            if ($scope.dateRangeStart) {
               var activeDate = moment($scope.dateRangeStart).subtract(1, $view).add(1, 'minute');

               $dates.filter(function (date) {
                  return date.localDateValue() <= activeDate.valueOf()
               }).forEach(function (date) {
                  date.selectable = false;
               })
            }
         }
         // END START END DATE


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