const { events, Job, Group } = require('brigadier')

events.on("push", (brigadeEvent, project) => {
    
    var acrServer = project.secrets.acrServer
    var acrName = project.secrets.acrName
    var azServicePrincipal = project.secrets.azServicePrincipal
    var azClientSecret = project.secrets.azClientSecret
    var azTenant = project.secrets.azTenant
    
    var gitPayload = JSON.parse(brigadeEvent.payload)
    var today = new Date()
    var image = "chzbrgr71/kubecon-rating-web"
    var gitSHA = brigadeEvent.revision.commit.substr(0,7)
    var imageTag = "master-" + String(gitSHA)
    var acrImage = image + ":" + imageTag

    console.log("brigade build started")

    // setup container build brigade job
    var acrBuilder = new Job("job-runner-acr-builder")
    acrBuilder.storage.enabled = false
    acrBuilder.image = "briaracreu.azurecr.io/chzbrgr71/azure-cli:0.0.5"
    acrBuilder.tasks = [
        `cd /src/app/web`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t ${acrImage} --build-arg BUILD_DATE="${String(today)}" --build-arg VCS_REF=${gitSHA} --build-arg IMAGE_TAG_REF=${imageTag} -f ./Dockerfile --context . -r ${acrName}`
    ]

    // brigade job. Helm chart
    var helmDeploy = new Job("job-runner-helm")
    helmDeploy.storage.enabled = false
    helmDeploy.image = "briaracreu.azurecr.io/chzbrgr71/k8s-helm:v2.8.2"
    helmDeploy.tasks = [
        `helm upgrade --install --reuse-values kubecon ./src/app/web/charts/kubecon-rating-web --set image=${acrServer}/${image} --set imageTag=${imageTag}`
    ]

    var pipeline = new Group()
    pipeline.add(acrBuilder)
    pipeline.add(helmDeploy)
    pipeline.runEach()

    
    
})

events.on("after", (event, project) => {

    // send Twitter DM
    const sendTo = "SweetDee529"

    const twitter = new Job("tweet", "briaracreu.azurecr.io/chzbrgr71/twitter-t")
    twitter.storage.enabled = false
    twitter.env = {
        OWNER: project.secrets.OWNER,
        CONSUMER_KEY: project.secrets.CONSUMER_KEY,
        CONSUMER_SECRET: project.secrets.CONSUMER_SECRET,
        ACCESS_TOKEN: project.secrets.ACCESS_TOKEN,
        ACCESS_SECRET: project.secrets.ACCESS_SECRET
    }

    twitter.tasks = [
        "env2creds",
        `t dm ${sendTo} "vidunderlig! brigade rørledning færdiggjort med succes"`
        //`t update "I'm tweeting from Brigade. Fake news."`
    ]

    //twitter.run()

})