{
  inputs = {
    xnode-manager.url = "github:Openmesh-Network/xnode-manager";
    subdomain-distributor.url = "github:Openmesh-Network/subdomain-distributor";
    nixpkgs.follows = "subdomain-distributor/nixpkgs";
  };

  outputs = inputs: {
    nixosConfigurations.container = inputs.nixpkgs.lib.nixosSystem {
      specialArgs = {
        inherit inputs;
      };
      modules = [
        inputs.xnode-manager.nixosModules.container
        {
          services.xnode-container.xnode-config = {
            host-platform = ./xnode-config/host-platform;
            state-version = ./xnode-config/state-version;
            hostname = ./xnode-config/hostname;
          };
        }
        inputs.subdomain-distributor.nixosModules.default
        (
          { pkgs, ... }@args:
          {
            # START USER CONFIG
            services.subdomain-distributor.domain = "openmesh.cloud";
            services.subdomain-distributor.soa.nameserver = "dns.openmesh.network";
            services.subdomain-distributor.soa.mailbox = "samuel.mens@openmesh.network";
            # END USER CONFIG

            services.subdomain-distributor.enable = true;

            services.resolved.enable = args.lib.mkForce false;
          }
        )
      ];
    };
  };
}
