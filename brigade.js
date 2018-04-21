const { events, Job, Group } = require('brigadier')

events.on("push", (brigadeEvent, project) => {
    
    // setup variables
    var gitPayload = JSON.parse(brigadeEvent.payload)
    var acrServer = project.secrets.acrServer
    var acrName = project.secrets.acrName
    var azServicePrincipal = project.secrets.azServicePrincipal
    var azClientSecret = project.secrets.azClientSecret
    var azTenant = project.secrets.azTenant
    var today = new Date()
    var image = "chzbrgr71/kubecon-rating-web"
    var gitSHA = brigadeEvent.revision.commit.substr(0,7)
    var imageTag = "master-" + String(gitSHA)
    var acrImage = image + ":" + imageTag
    
    console.log(`==> gitHub webook with commit ID ${gitSHA}`)
    console.log(`==> logging into Azure with ${azServicePrincipal}`)

    // setup brigade jobs
    var acrBuilder = new Job("job-runner-acr-builder")
    acrBuilder.storage.enabled = false
    acrBuilder.image = "chzbrgr71/azure-cli"
    acrBuilder.tasks = [
        `cd /src/app/web`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t ${acrImage} --build-args BUILD_DATE="${String(today)}" VCS_REF=${gitSHA} IMAGE_TAG_REF=${imageTag} -f ./Dockerfile --context . -r ${acrName}`
    ]

    var helmDeploy = new Job("job-runner-helm")
    helmDeploy.storage.enabled = false
    helmDeploy.image = "lachlanevenson/k8s-helm:v2.8.2"
    helmDeploy.tasks = [
        "cd /src/",
        `helm upgrade --install --reuse-values kubecon ./app/web/charts/kubecon-rating-web --set image=${acrServer}/${image} --set imageTag=${imageTag}`
    ]

    var pipeline = new Group()
    pipeline.add(acrBuilder)
    pipeline.add(helmDeploy)
    
    pipeline.runEach()

})

events.on("after", (event, proj) => {
    console.log("==> brigade pipeline finished successfully")

    var twilio = new Job("job-twilio")
    twilio.storage.enabled = false
    twilio.image = "chzbrgr71/twilio-cli"
    twilio.env = {
        TWILIO_ACCOUNT_SID: proj.secrets.twilioSid,
        TWILIO_AUTH_TOKEN: proj.secrets.twilioToken
    }

    twilio.tasks = [
        `twilio sms to "+14129536948" from "+14125679951" body "vidunderlig! brigade rørledning færdiggjort med succes"`
    ]
    twilio.run()

})