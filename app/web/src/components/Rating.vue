
<template>
  <section>
    <div class="row at-row flex-center flex-middle">
      <div class="col-lg-24">
        <a href="/"><img class="super-justice" :src="headerImage"></a>
      </div>
    </div>
    <div class="row at-row flex-center flex-middle">
      <div class="col-lg-24">
        <h1 class="super-header">{{subtitle}}</h1>
      </div>
    </div>
    <div class="row at-row">
      <div class="col-lg-6" v-for="(item) in subjects">
        <div class="at-box-row">
          <at-card :bordered="false">
            <h4 slot="title" class="super-name">
              {{item.name}}
            </h4>
            <div class="flex-center flex-middle">
              <img class="super-image" :src="item.imgUrl">
            </div>
            <div class="super-rate-foot super-star-total-rate">
              <at-rate :allow-half="true" :ref="item._id" :id="item._id" @on-change="rateHero(item._id, item.name, $event)"></at-rate>
            </div>
            <div class="flex-center flex-middle super-star-total-shell"><span class="super-star-text-sms"><a :href="item.description">SEND SMS</a></span></div>
          </at-card>
        </div>
      </div>
    </div>
    <div class="row at-row flex-center flex-middle">
      <div class="col-lg-24">
        <at-button @click="submitRatings" class="rate-submit" icon="icon-check" hollow>&nbsp;&nbsp;SUBMIT MY RATINGS&nbsp;&nbsp;</at-button>
      </div>
    </div>
  </section>
</template>

<script>

export default {
  data () {
    return {
      headerImage: "",
      subtitle: "",
      userIp: "",
      subjects: [],
      errors: [],
      pageName: 'Rating'
    }
  },
    created() {
      var page = this.$siteLayout[this.pageName]
      document.title = page.title
      this.headerImage = page.headerImage
      this.subtitle = page.subtitle
      this.$http.get("/subject-api/api/subjects/" + this.$siteName) 
      .then(response => {
        this.subjects = response.data.payload
        this.$Notify({ title: 'Ready to Rate', message: 'Data Retrieved', type:'success' })
        // hardcoding this for now
        //this.userIp = this.getIp()
      })
      .catch(e => {
        // lets console errors, but turn the notify off
        console.log(e);
        // this.$Notify({ title: 'ERROR', message: e, type:'error' })
        this.errors.push(e)
      })

    },
    methods: {
      rateHero: function (id, name, event) {
        if (name === 'Batman' && event > 3.5) {
          this.$Notify({ title: `Seriously?`, message: `He's just a rich guy. Zero super powers. Altrustic? Yes. Not a Superhero. Are you a PM?`, type: 'warning', duration: 10000 })
        }
      },
      submitRatings() {
        var rate = {}
        var refs = this.$refs
        var router = this.$router
        rate["userIp"] = this.userIp
        rate["ratings"] = []
        
        for (var h in refs) {
          rate.ratings.push(
            { id: h, 
            rating: Number( refs[h][0].currentValue || 0 ) 
            }
          )
        }   
        console.log(rate);
        this.$http.post("/rating-api/api/ratings/" + this.$currentSite, rate)
        .then(response => {
          router.push('leaderboard')
        })
        .catch(e => {
          this.errors.push(e)
        })

      }
    }
  };
</script>