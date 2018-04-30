### brigage install

helm repo add brigade https://azure.github.io/brigade
    
helm install -n brigade brigade/brigade --set rbac.enabled=false --set api.service.type=LoadBalancer

### brigade project

github:
    token: "a9257112d6b98afb7c49f1852524e02e6a9c9a26"
secrets:
    acrServer: briaracreu.azurecr.io
    acrName: briaracreu
    azServicePrincipal: "http://briar-aks-contrib"
    azClientSecret: "4cfb1f4d-77e4-469e-a2b8-d143cfceab8c"
    azTenant: "72f988bf-86f1-41af-91ab-2d7cd011db47"

helm install --name brig-proj-kubecon-web brigade/brigade-project -f brig-proj-kubecon.yaml

### brigade.js

1. 
    // variables
    var acrServer = project.secrets.acrServer
2. 
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
3. 
    console.log(`==> gitHub webook with commit ID ${gitSHA}`)
4. 
    var acrBuilder = new Job("job-runner-acr-builder")
5. 
    acrBuilder.storage.enabled = false
    acrBuilder.image = "briaracreu.azurecr.io/chzbrgr71/azure-cli:0.0.5"
    acrBuilder.tasks = [
        `cd /src/app/web`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t ${acrImage} --build-arg BUILD_DATE="${String(today)}" --build-arg VCS_REF=${gitSHA} --build-arg IMAGE_TAG_REF=${imageTag} -f ./Dockerfile --context . -r ${acrName}`
    ]
6. 
    var helmDeploy = new Job("job-runner-helm")
    helmDeploy.storage.enabled = false
    helmDeploy.image = "briaracreu.azurecr.io/chzbrgr71/k8s-helm:v2.8.2"
    helmDeploy.tasks = [
        `helm upgrade --install --reuse-values kubecon ./src/app/web/charts/kubecon-rating-web --set image=${acrServer}/${image} --set imageTag=${imageTag}`
    ]
7. 
    var pipeline = new Group()
    pipeline.add(acrBuilder)
    pipeline.add(helmDeploy)
    
    pipeline.runEach()
8. 
    export GH_WEBHOOK=http://$(kubectl get svc brigade-brigade-github-gw -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):7744/events/github

    echo $GH_WEBHOOK | pbcopy
9. 


