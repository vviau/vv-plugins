
arc.run(['$rootScope', function ($rootScope) {

   $rootScope.plugin("cubewiseBedrockCubeDataExportOld", "Bedrock Export Old", "menu/cube", {
      icon: "fa-cloud-download",
      description: "This plugin exports cube data using Bedrock.Cube.Data.Export process. You can specify:....",
      author: "Cubewise",
      url: "https://github.com/cubewise-code/arc-plugins",
      version: "1.0.0"
   });

}]);

arc.service('cubewiseBedrockCubeDataExportOld', ['$rootScope', '$tm1', 'ngDialog', '$dialogs', '$http', function ($rootScope, $tm1, ngDialog, $dialogs, $http) {

   // The interface you must implement
   this.execute = function (instance, name) {

      // Create a callback function for the dialog
      var action = function (options) {
         dialog.close();
         //Overwritte pFilter if filter defined per dimension
         var nbDimensionFiltered = 1;
         _.each(options.dimensions, function (item) {
            if (item.filter) {
               if(nbDimensionFiltered==1){
                  options.filter = item.Name +':'+item.filter;
               }else{
                  options.filter = options.filter+' & '+item.Name +':'+item.filter;
               }
               nbDimensionFiltered++;
            }
         });
         // Call Bedrock.Cube.Data.Export via the $tm1 service 
         $tm1.processExecute(instance, "Bedrock.Cube.Data.Export", [
            {
               Name: "pCube",
               Value: name
            }, {
               Name: "pFilter",
               Value: options.filter
            }, {
               Name: "pSkipRules",
               Value: options.skipRules ? 1 : 0
            }, {
               Name: "pSkipCons",
               Value: options.skipCons ? 1 : 0
            }, {
               Name: "pFilePath",
               Value: options.filePath
            }, {
               Name: "pFileName",
               Value: options.fileName
            }
         ]).then(function (result) {
            if (result.success) {
               // It has finished with success
               $rootScope.reloadInstance(instance);
            }
         });
      };

      var dialog = undefined;

      //Get all dimensions
      var query = "/Cubes('" + name + "')/Dimensions?$select=Name";
      $http.get(encodeURIComponent(instance) + query).then(function (result) {
         var dimensions = result.data.value;
         //Create hierarchy property required for Subset Editor
         _.each(dimensions, function(dim){
            dim.hierarchy = {
               name: dim.Name,
               dimension: dim.Name,
               subset:"",
               expression:"",
               expressions:"",
               alias:dim.Name
            }
         });
         console.log(dimensions);
         // Use ngDialog (https://github.com/likeastore/ngDialog) for custom dialog boxes
         // Pass a template URL to use an external file, path should start with __/plugins/{{your-plugin-name}}
         // Use the data option to pass through data (or functions to the template), the data is then used in
         //  the template with ngDialogData
         // vincent:
         //initialize the diaglog box inside the REST API request to make sure the dimensions are initialized
         dialog = ngDialog.open({
            className: "ngdialog-theme-default small",
            template: "__/plugins/bedrock-cube-data-export-old/template.html",
            controller: ['$rootScope', '$scope', '$subsetDialogs', function ($rootScope, $scope, $subsetDialogs) {
               //Open Subset Editor
               $scope.editSubset = function (dimension) {

                  var hierarchy = dimension.hierarchy;

                  var handler = function(subset, elements){
                
                     // subset.selected has what element was clicked
                     dimension.filter = subset.selected.alias;
                     
                  };
                  
                  // Probably don't need the expression or expressions (not tested)
                  var subset = {
                     name: hierarchy.subset,
                     expression: hierarchy.expression,
                     expressions: hierarchy.expressions,
                     alias: hierarchy.alias,
                     isSelector: true
                  };
   
                  $subsetDialogs.open(instance, hierarchy.dimension, hierarchy.name, subset, handler);
                  
                };

            }],
            data: {
               fileName: name + ".csv",
               filePath: "C:\\Arc",
               filter: "",
               skipRules: true,
               skipCons: true,
               dimensions: dimensions,
               showDimensions: true,
               action: action // pass through the function declared above
            }
         });
      });

   };

}]);