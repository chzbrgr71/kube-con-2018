const { events, Job, Group } = require('brigadier')

events.on("push", (brigadeEvent, project) => {
    
    // setup variables
    var gitPayload = JSON.parse(brigadeEvent.payload)
    var acrServer = project.secrets.acrServer
    var acrName = project.secrets.acrName
    var azServicePrincipal = project.secrets.azServicePrincipal
    var azClientSecret = project.secrets.azClientSecret
    var azTenant = project.secrets.azTenant
    var image = "chzbrgr71/kubecon-rating-web"
    var gitSHA = brigadeEvent.revision.commit.substr(0,7)
    var imageTag = "master-" + String(gitSHA)
    var acrImage = String(acrServer) + "/" + image + ":" + imageTag
    
    console.log(`==> gitHub webook with commit ID ${gitSHA}`)
    console.log(`==> logging into Azure with ${azServicePrincipal}`)

    // setup brigade jobs
    var acrBuilder = new Job("job-runner-acr-builder")
    acrBuilder.storage.enabled = false
    acrBuilder.privileged = true
    acrBuilder.image = "chzbrgr71/azure-cli"
    acrBuilder.tasks = [
        `cd /src/app/web`,
        `az login --service-principal -u ${config.get("azServicePrincipal")} -p ${config.get("azClientSecret")} --tenant ${config.get("azTenant")}`,
        `az acr build -t ${acrImage} -f ./Dockerfile --context . -r ${acrName}`
    ]
    
    var pipeline = new Group()
    pipeline.add(acrBuilder)
    //pipeline.add(helmDeploy)
    if (brigConfig.get("branch") == "master") {
        pipeline.runEach()
    } else {
        console.log(`==> no jobs to run when not master`)
    }  
})

events.on("after", (event, proj) => {
    console.log("brigade pipeline finished successfully")    
})