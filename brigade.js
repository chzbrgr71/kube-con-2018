const { events, Job, Group } = require('brigadier')

events.on("push", (brigadeEvent, project) => {

    // variables
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

    console.log(`==> gitHub webook with commit ID ${gitSHA}`)
    
    var acr = new Job("job-runner-acr-builder")
    acr.storage.enabled = false
    acr.image = "briaracreu.azurecr.io/chzbrgr71/azure-cli:0.0.5"
    acr.tasks = [
        `cd /src/app/web`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t ${acrImage} --build-arg BUILD_DATE="${String(today)}" --build-arg VCS_REF=${gitSHA} --build-arg IMAGE_TAG_REF=${imageTag} -f ./Dockerfile --context . -r ${acrName}`
    ]

    var helm = new Job("job-runner-helm")
    helm.storage.enabled = false
    helm.image = "briaracreu.azurecr.io/chzbrgr71/k8s-helm:v2.8.2"
    helm.tasks = [
        `helm upgrade --install --reuse-values kubecon ./src/app/web/charts/kubecon-rating-web --set image=${acrServer}/${image} --set imageTag=${imageTag}`
    ]

    var pipeline = new Group()
    pipeline.add(acr)
    pipeline.add(helm)
    pipeline.runEach()

})

events.on("after", (event, project) => {

})