//accept parameters
var opts = require('opts');
var fs = require('fs');
var exec = require('child_process').exec;

var createConfigs = "createConfigs";
var startAll = "startAll";
var stopAll = "stopAll";
var monitor = "monitor"; //todo
var execute = "execute"; //todo

var echoConfig= "echoConfig";

var options = [
	{   short       : 'c'
	, long        : 'command'
	, description : 'The action you want the script to take values: createConfigs, startAll, stopAll, execute'
	, value	: true      
	, required : true
	},
	{   short       : 'cf'
	, long        : 'conf'
	, description : 'The path to the Redis Manager json config file.'
	, value	: true      
	, required : true
	},
	{  short       : 'e'
		, long        : 'exec'
		, description : 'A command you want to send to redis.'
		, value	: true      		
	}

];

opts.parse(options, true);
var c = opts.get('c'); //command
var cf = opts.get('cf'); //conf file
var e = opts.get('e'); //optional command
var confObj = undefined;

//read the config file
fs.readFile(cf, function (err, data) 
{
	if (err) { throw err; }	
	confObj = JSON.parse(data);			
	if (c == echoConfig)
	{
		console.log("******************************");
		console.log("Raw:");
		console.log(data);
		console.log("******************************\n\n");

		console.log("******************************");
		console.log("Parsed:");
		console.log("Master Template: " + confObj.masterTemplate);		
		console.log("Instances: ");
		for(var i =0; i<confObj.instances.length; i++)
		{
			var instance = confObj.instances[i];
			console.log("\tName: " + instance.name);
			console.log("\tIp: " + instance.ip);
			console.log("\tPort: " + instance.port);
			if (instance.slaveof != undefined)
			{
				console.log("\tSlave of: " + instance.slaveof);
			}
			console.log("\t\n");
		}
		console.log("******************************\n\n");
	}//end if (c == echoConfig)
	else if (c == createConfigs)
	{
		//verify we can find and read the master and slave templates.
		fs.readFile(confObj.masterTemplate, function (err, data) 
		{
			if (err) throw err;
			if (data == undefined || data.length == 0) { throw "Master Template seemed to be invalid or 0 bytes.";}
			var mainTemplate = data.toString();
			
			//loop through each instance
			for(var i =0; i<confObj.instances.length; i++)
			{				
				var instance = confObj.instances[i];
				
				//for every instance in our conf, modify the redis master conf accordingly 				
				var dir= instance.ip + "_" +instance.port;																
				var templateFile= dir + "/" + dir + ".conf";
				var templateFileName = dir + ".conf";
				var initCommand = "./redisInitScript.sh '" + dir + "' '" + templateFile + "'";
							
				
				remoteExec(instance.ip, initCommand, dir, templateFile, templateFileName, instance, function(error, stdout,stderr, directory, theTemplateFile, theTemplateFileName, theInstance)
				{
					console.log(stdout);
					
					if (error)
					{
						console.log("err: " + error);
						throw error;
					}

					if (stderr)
					{
						console.log("stderr: " + stderr);
						throw stderr;
					}

					
					//mod the template					
					var tempTemplate = mainTemplate.replace(/\[\[port\]\]/g, theInstance.port);							
					if (theInstance.slaveof !=undefined)
					{
						tempTemplate = tempTemplate.replace(/\[\[slaveof\]\]/g, "slaveof");
						var masterInstance = findInstance(theInstance.name, theInstance.slaveof);
						tempTemplate = tempTemplate.replace(/\[\[masterip\]\]/g, masterInstance.ip);
						tempTemplate = tempTemplate.replace(/\[\[masterport\]\]/g, masterInstance.port);
					}
					else
					{
						tempTemplate = tempTemplate.replace(/\[\[slaveof\]\]/g, "");
						tempTemplate = tempTemplate.replace(/\[\[masterip\]\]/g, "");
						tempTemplate = tempTemplate.replace(/\[\[masterport\]\]/g, "");
					}

					fs.writeFile(theTemplateFileName , tempTemplate, function(err)
					{
						remoteWriteFile(theInstance.ip,theTemplateFileName,theTemplateFile,function(err){
							if (err)
							{
								console.log("Write Error: " + err);
								throw err;
							}
							else
							{
								console.log("Placed conf file " + theTemplateFile);
							}
						});
					});//end fs.writeFile
					
				});//end remoteExec
			}//end for									
		}); //end fs.readFile
							
	}//end else if (c == createConfigs)
	else if (c == startAll)
	{
		for(var i =0; i<confObj.instances.length; i++)
		{
			var instance = confObj.instances[i];
			var command = "./startRedis.sh " + instance.ip + " " + instance.port;
			remoteExec(instance.ip, command, undefined, undefined, undefined, instance, function(error, stdout,stderr, directory, theTemplateFile, theTemplateFileName, theInstance)
			{
				if (error)
				{
					console.log("Failed to start an instance: " + theInstance.name);
					throw error;
				}
				
				if (stderr)
				{
					console.log("Looks like redis didn't want to start for instance: " + theInstance.name);
					throw error;
				}
				
				console.log ("Redis started for instance: " + theInstance.name + ".\nStdout: " + stdout);				
			
			});
			
		}//end for
		
	
	}//end else if (c == startAll) $REDIS_CLI -p $LISTENING_PORT SHUTDOWN
	else if (c == stopAll)
	{
		for(var i =0; i<confObj.instances.length; i++)
		{
			var instance = confObj.instances[i];
			var command = "./stopRedis.sh " + instance.ip + " " + instance.port;
			remoteExec(instance.ip, command, undefined, undefined, undefined, instance, function(error, stdout,stderr, directory, theTemplateFile, theTemplateFileName, theInstance)
			{
				if (error)
				{
					console.log("Failed to stop an instance: " + theInstance.name);
					throw error;
				}

				if (stderr)
				{
					console.log("Looks like redis didn't want to stop for instance: " + theInstance.name);
					throw error;
				}

				console.log ("Redis stopped for instance: " + theInstance.name + ".\nStdout: " + stdout);				

			});

		}//end for
					
	}//end else if (c == stopAll) 
	else if (c == execute)
	{		
		for(var i =0; i<confObj.instances.length; i++)
		{
			var instance = confObj.instances[i];
			var command = "./executeRedis.sh " + instance.ip + " " + instance.port + " " + "\\\"" + e + "\\\"";
			console.log(command);
			remoteExec(instance.ip, command, undefined, undefined, undefined, instance, function(error, stdout,stderr, directory, theTemplateFile, theTemplateFileName, theInstance)
			{
				if (error)
				{
					console.log("Failed to execute command: " + e + " on: " + theInstance.name);
					throw error;
				}

				if (stderr)
				{
					console.log("Failed to execute command: " + e + " on: " + theInstance.name);
					throw stderr;
				}

				console.log("Executed command: " + e + " on: " + theInstance.name + " result: " + stdout);

			});	
		}//end for
		
	}//end else if (c == execute) 
});//end fs.readFile(cf, function (err, data) 

		
function findInstance(myName, masterName)
{
	for(var i =0; i<confObj.instances.length; i++)	
	{	
		if (confObj.instances[i].name = masterName)
		{
			return confObj.instances[i];
		}
	}
	
	throw "Your instance: " + myName + " was set up to be a slave of: " + masterName + " but it seems that " + masterName + " does not exist in the list of instances.";
}
	
function remoteExec(ip, command, dir, templateFile, templateFileName, instance, callback)
{
	var theCommand = "ssh " + ip + " " + command;
	console.log("Executing: " + theCommand);
	exec(theCommand, function(error, stderr, stdout) { callback(error, stderr, stdout, dir, templateFile, templateFileName, instance); });
}

function remoteWriteFile(ip, localFile, remoteFile, callback)
{
	//execute: scp thePath/theFile t.h.e.ip thePath/theFile
	var theCommand = "scp " + localFile + " " + ip + ":" + remoteFile;
	console.log("Executing: " + theCommand);
	exec(theCommand, callback);
}


